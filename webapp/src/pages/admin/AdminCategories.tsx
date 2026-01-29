import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/useAdminStore';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Name must be less than 50 characters'),
});

interface CategoryRowProps {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
}

function CategoryRow({
  category,
  level = 0,
  onEdit,
  onDelete,
  onAddSubcategory,
}: CategoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 transition-soft hover:bg-muted/50',
          level > 0 && 'ml-6'
        )}
      >
        {hasSubcategories ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="h-5 w-5" />
        )}

        <span className="flex-1 text-sm font-medium">{category.name}</span>
        <span className="text-xs text-muted-foreground">/{category.slug}</span>

        <div className="flex items-center gap-1 opacity-0 transition-soft group-hover:opacity-100">
          {level === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddSubcategory(category.id)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasSubcategories && isExpanded && (
        <div className="mt-1 space-y-1">
          {category.subcategories?.map((sub) => (
            <CategoryRow
              key={sub.id}
              category={sub}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAdminStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | undefined>();
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleCreate = () => {
    const result = categorySchema.safeParse({ name: newName });
    if (!result.success) {
      setErrors({ name: result.error.errors[0].message });
      return;
    }
    
    addCategory(result.data.name, parentIdForNew);
    toast.success(parentIdForNew ? 'Subcategory created' : 'Category created');
    setIsCreateOpen(false);
    setNewName('');
    setParentIdForNew(undefined);
    setErrors({});
  };

  const handleEdit = () => {
    const result = categorySchema.safeParse({ name: editName });
    if (!result.success) {
      setErrors({ name: result.error.errors[0].message });
      return;
    }

    if (selectedCategory) {
      updateCategory(selectedCategory.id, result.data.name);
      toast.success('Category updated');
      setIsEditOpen(false);
      setSelectedCategory(null);
      setEditName('');
      setErrors({});
    }
  };

  const handleDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
      toast.success('Category deleted');
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    }
  };

  const openEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditName(category.name);
    setErrors({});
    setIsEditOpen(true);
  };

  const openDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const openAddSubcategory = (parentId: string) => {
    setParentIdForNew(parentId);
    setNewName('');
    setErrors({});
    setIsCreateOpen(true);
  };

  const openCreateCategory = () => {
    setParentIdForNew(undefined);
    setNewName('');
    setErrors({});
    setIsCreateOpen(true);
  };

  return (
    <AdminLayout
      title="Categories"
      description="Manage news categories and subcategories"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateCategory} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onAddSubcategory={openAddSubcategory}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentIdForNew ? 'Add Subcategory' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {parentIdForNew
                ? 'Create a new subcategory under the selected category.'
                : 'Create a new top-level category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setErrors({});
                }}
                placeholder="Enter category name"
                maxLength={50}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setErrors({});
                }}
                placeholder="Enter category name"
                maxLength={50}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This
              action cannot be undone and will also remove all subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
