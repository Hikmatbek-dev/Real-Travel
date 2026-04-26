import { useState } from "react";
import { useData, Tour } from "@/hooks/use-data";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit2, Trash2, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Tours() {
  const { tours, saveTours, isLoaded } = useData();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // Form state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState<Partial<Tour>>({});
  
  // Delete state
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  if (!isLoaded) return null;

  const filteredTours = tours.filter(tour => 
    tour.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tour.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingTour(null);
    setFormData({
      name: "",
      price: 0,
      location: "",
      duration: 1,
      description: "",
      image: ""
    });
    setIsTourModalOpen(true);
  };

  const handleOpenEdit = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({ ...tour });
    setIsTourModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setTourToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTour = () => {
    if (!formData.name || !formData.price || !formData.location || !formData.duration) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    if (editingTour) {
      const updatedTours = tours.map(t => 
        t.id === editingTour.id ? { ...t, ...formData } as Tour : t
      );
      saveTours(updatedTours);
      toast({ title: "Tour updated", description: "The tour has been successfully updated." });
    } else {
      const newTour: Tour = {
        ...(formData as Tour),
        id: `t${Date.now()}` // simple unique id
      };
      saveTours([newTour, ...tours]);
      toast({ title: "Tour added", description: "The new tour has been successfully created." });
    }
    setIsTourModalOpen(false);
  };

  const handleDeleteTour = () => {
    if (tourToDelete) {
      const updatedTours = tours.filter(t => t.id !== tourToDelete);
      saveTours(updatedTours);
      toast({ title: "Tour deleted", description: "The tour has been permanently removed." });
    }
    setIsDeleteAlertOpen(false);
    setTourToDelete(null);
  };

  return (
    <AdminLayout title="Tours">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search tours..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Tour
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Tour Details</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No tours found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTours.map((tour) => (
                    <TableRow key={tour.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="h-12 w-16 rounded overflow-hidden bg-muted border border-border">
                          {tour.image ? (
                            <img src={tour.image} alt={tour.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tour.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" /> {tour.location}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        ${tour.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        <div className="flex items-center text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          {tour.duration} days
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(tour)}>
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(tour.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isTourModalOpen} onOpenChange={setIsTourModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Tour" : "Add New Tour"}</DialogTitle>
            <DialogDescription>
              {editingTour ? "Make changes to the tour details below." : "Fill in the details to create a new tour offering."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input 
                id="name" 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Location *</Label>
              <Input 
                id="location" 
                value={formData.location || ""} 
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price ($) *</Label>
              <Input 
                id="price" 
                type="number"
                value={formData.price || ""} 
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">Duration (days) *</Label>
              <Input 
                id="duration" 
                type="number"
                value={formData.duration || ""} 
                onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-3">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3 min-h-[100px]" 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right mt-3">Image</Label>
              <div className="col-span-3 space-y-3">
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {formData.image && (
                  <div className="h-32 rounded overflow-hidden border border-border mt-2">
                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTourModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTour}>Save Tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tour
              from your offerings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTour} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
