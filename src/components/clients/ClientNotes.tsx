import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

interface Note {
  id: string;
  note: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string };
}

export function ClientNotes({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchNotes();
    getCurrentUser();
  }, [clientId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("client_notes")
      .select("*, profiles(full_name)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch notes");
    } else {
      setNotes(data || []);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("client_notes").insert({
        client_id: clientId,
        user_id: user?.id,
        note: newNote,
      });

      if (error) throw error;

      await supabase.from("client_activities").insert({
        client_id: clientId,
        user_id: user?.id,
        activity_type: "note_added",
        description: "Added a note",
      });

      setNewNote("");
      fetchNotes();
      toast.success("Note added successfully");
    } catch (error: any) {
      toast.error("Failed to add note: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("client_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      fetchNotes();
      toast.success("Note deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete note: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>
            {loading ? "Adding..." : "Add Note"}
          </Button>
        </div>

        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{note.profiles.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </p>
                </div>
                {note.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
