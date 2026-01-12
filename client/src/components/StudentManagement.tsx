import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface StudentManagementProps {
  courseId: number;
  onStudentAdded?: () => void;
}

export function StudentManagement({ courseId, onStudentAdded }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast.error("Por favor ingresa un email");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/admin/students/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          email: newStudentEmail,
        }),
      });

      if (!response.ok) throw new Error("Error al asignar estudiante");

      toast.success("Estudiante asignado exitosamente");
      setNewStudentEmail("");
      onStudentAdded?.();
    } catch (error) {
      toast.error("Error al asignar estudiante");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm("¿Estás seguro de que deseas remover este estudiante?")) return;

    try {
      const response = await fetch("/api/admin/students/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentId,
        }),
      });

      if (!response.ok) throw new Error("Error al remover estudiante");

      toast.success("Estudiante removido exitosamente");
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      toast.error("Error al remover estudiante");
      console.error(error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestión de Estudiantes</CardTitle>
        <CardDescription>
          Agrega o remueve estudiantes del curso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Student Form */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email del estudiante..."
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddStudent()}
            />
            <Button
              onClick={handleAddStudent}
              disabled={isAdding}
              className="gap-2"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Agregar
            </Button>
          </div>
        </div>

        {/* Students List */}
        <div>
          <h3 className="text-sm font-medium mb-4">Estudiantes Asignados</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No hay estudiantes asignados aún
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
