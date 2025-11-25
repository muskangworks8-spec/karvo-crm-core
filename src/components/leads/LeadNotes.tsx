import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Trash2 } from "lucide-react";

interface Note {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

interface LeadNotesProps {
  leadId: string;
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
    getCurrentUser();
  }, [leadId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_notes")
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch notes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: noteError } = await supabase.from("lead_notes").insert({
        lead_id: leadId,
        user_id: user.id,
        note: newNote.trim(),
      });

      if (noteError) throw noteError;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: "note_added",
        description: "Added a new note",
      });

      toast.success("Note added successfully");
      setNewNote("");
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
      if (error) throw error;
      toast.success("Note deleted successfully");
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes & Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={!newNote.trim()}>
            Add Note
          </Button>
        </div>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{note.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                  {currentUserId === note.user_id && (
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
