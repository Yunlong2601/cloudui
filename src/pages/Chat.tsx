import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Send, Shield, Lock, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ChatRoom {
  id: number;
  name: string;
  description: string | null;
  requires2FA: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  roomId: number;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function Chat() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomRequires2FA, setNewRoomRequires2FA] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingRoom, setPendingRoom] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], refetch: refetchRooms } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: isAuthenticated,
  });

  const { data: roomMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"],
    enabled: !!selectedRoom,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; requires2FA: boolean }) => {
      return apiRequest("/api/chat/rooms", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      refetchRooms();
      setShowCreateRoom(false);
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomRequires2FA(false);
      toast({ title: "Room created successfully" });
    },
  });

  const request2FAMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return apiRequest("/api/chat/2fa/request", {
        method: "POST",
        body: JSON.stringify({ roomId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "2FA code sent to your email" });
    },
    onError: () => {
      toast({ title: "Failed to send 2FA code", variant: "destructive" });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async ({ roomId, code }: { roomId: number; code: string }) => {
      return apiRequest("/api/chat/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ roomId, code }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      if (pendingRoom) {
        setSelectedRoom(pendingRoom);
        socket?.emit("join-room", pendingRoom.id);
      }
      setShow2FADialog(false);
      setPendingRoom(null);
      setTwoFACode("");
      toast({ title: "Verification successful" });
    },
    onError: () => {
      toast({ title: "Invalid or expired code", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (isAuthenticated && !socket) {
      const newSocket = io(window.location.origin.replace(':5000', ':3001'));
      setSocket(newSocket);

      newSocket.on("new-message", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setMessages(roomMessages.reverse());
  }, [roomMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectRoom = async (room: ChatRoom) => {
    if (room.requires2FA) {
      const response = await fetch(`/api/chat/2fa/status/${room.id}`);
      const data = await response.json();
      
      if (!data.verified) {
        setPendingRoom(room);
        setShow2FADialog(true);
        request2FAMutation.mutate(room.id);
        return;
      }
    }
    
    if (selectedRoom) {
      socket?.emit("leave-room", selectedRoom.id);
    }
    setSelectedRoom(room);
    socket?.emit("join-room", room.id);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;
    
    socket?.emit("send-message", {
      roomId: selectedRoom.id,
      userId: user.id,
      content: newMessage,
    });
    setNewMessage("");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">CloudVault Chat</h1>
          <p className="text-muted-foreground mb-6">Sign in to access secure messaging with 2FA protection</p>
        </div>
        <Button asChild size="lg">
          <a href="/api/login" data-testid="button-login">Sign In</a>
        </Button>
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Files</span>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" asChild>
              <a href="/api/logout" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button 
            onClick={() => setShowCreateRoom(true)} 
            className="w-full"
            data-testid="button-create-room"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Room
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`w-full p-3 rounded-md text-left transition-colors ${
                  selectedRoom?.id === room.id ? "bg-accent" : "hover:bg-muted"
                }`}
                data-testid={`button-room-${room.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{room.name}</span>
                  {room.requires2FA && (
                    <Badge variant="secondary" className="shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      2FA
                    </Badge>
                  )}
                </div>
                {room.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {room.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold">{selectedRoom.name}</h2>
              {selectedRoom.requires2FA && (
                <Badge variant="outline">
                  <Lock className="w-3 h-3 mr-1" />
                  Secure
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.userId === user?.id ? "justify-end" : ""}`}
                  >
                    {message.userId !== user?.id && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {message.user?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.userId === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.userId !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.user?.firstName || "Unknown"}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  data-testid="input-message"
                />
                <Button type="submit" size="icon" data-testid="button-send">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Chat Room</DialogTitle>
            <DialogDescription>Create a new room for secure messaging</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="General"
                data-testid="input-room-name"
              />
            </div>
            <div>
              <Label htmlFor="room-description">Description (optional)</Label>
              <Input
                id="room-description"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                placeholder="A place to chat..."
                data-testid="input-room-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify via email to join
                </p>
              </div>
              <Switch
                checked={newRoomRequires2FA}
                onCheckedChange={setNewRoomRequires2FA}
                data-testid="switch-2fa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createRoomMutation.mutate({
                  name: newRoomName,
                  description: newRoomDescription,
                  requires2FA: newRoomRequires2FA,
                })
              }
              disabled={!newRoomName.trim() || createRoomMutation.isPending}
              data-testid="button-confirm-create-room"
            >
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication Required</DialogTitle>
            <DialogDescription>
              A verification code has been sent to your email. Enter it below to access this secure room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                data-testid="input-2fa-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingRoom) {
                  verify2FAMutation.mutate({ roomId: pendingRoom.id, code: twoFACode });
                }
              }}
              disabled={twoFACode.length !== 6 || verify2FAMutation.isPending}
              data-testid="button-verify-2fa"
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
