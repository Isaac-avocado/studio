// src/components/user-profile-form.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { onAuthStateChanged, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase/config';
import type { FirestoreUser } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Edit3, Camera, Loader2, Save, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const profileSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').max(50, 'El nombre de usuario no puede exceder los 50 caracteres.'),
  profileImageFile: z.custom<FileList>().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const getFileExtension = (filename: string) => filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

export function UserProfileForm() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      profileImageFile: undefined,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        form.setValue('username', user.displayName || '');
        setImagePreviewUrl(user.photoURL);

        // Fetch Firestore user data
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setFirestoreUser(userDocSnap.data() as FirestoreUser);
        }
      } else {
        // Handle case where user is not logged in, though this page should be protected
        setCurrentUser(null);
        setFirestoreUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type and size (optional)
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Archivo inválido", description: "Por favor, selecciona un archivo de imagen." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El tamaño máximo de la imagen es 5MB." });
        return;
      }
      form.setValue('profileImageFile', files);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeProfilePicture = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const oldPhotoURL = currentUser.photoURL;

      // Remove from Firebase Auth
      await updateProfile(currentUser, { photoURL: null });

      // Remove from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL: null });
      
      // Attempt to delete from Storage if it's a Firebase Storage URL
      if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = storageRef(storage, oldPhotoURL);
          await deleteObject(oldImageRef);
        } catch (storageError: any) {
          // Log if deletion fails but don't block UI update
          console.warn("Could not delete old profile picture from storage:", storageError);
           if (storageError.code === 'storage/object-not-found') {
             // Object already deleted or never existed, safe to ignore
           } else {
            // Other storage error, could inform user if critical
           }
        }
      }

      setImagePreviewUrl(null);
      setCurrentUser(auth.currentUser); // Refresh current user state
       setFirestoreUser(prev => prev ? {...prev, photoURL: null} : null);
      toast({ title: 'Foto de perfil eliminada', description: 'Tu foto de perfil ha sido eliminada.' });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la foto de perfil.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onSubmit(values: ProfileFormValues) {
    if (!currentUser) return;
    setIsSubmitting(true);

    let newPhotoURL: string | null = currentUser.photoURL;

    try {
      // Handle profile picture upload
      if (values.profileImageFile && values.profileImageFile[0]) {
        const file = values.profileImageFile[0];
        const extension = getFileExtension(file.name);
        const imageFileName = `profile_image.${extension}`;
        const imageRef = storageRef(storage, `profile-pictures/${currentUser.uid}/${imageFileName}`);
        
        // If there's an old photoURL and it's from Firebase Storage, attempt to delete it
        // This part is tricky because the filename might change if the extension changes.
        // A more robust solution would be to always use a fixed name like 'avatar' without extension,
        // or store the full storage path. For now, we'll try to delete if the new upload is different.
        const oldPhotoURL = currentUser.photoURL;
        if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
            // Avoid deleting if the new image path is the same (e.g. re-uploading with same name/type)
            // This simple check might not be enough if file name structure varies widely.
            // A better check would be if a new file is *actually* being uploaded.
            if (values.profileImageFile) { // Check if a new file is staged for upload
                try {
                    const oldImageRef = storageRef(storage, oldPhotoURL);
                    await deleteObject(oldImageRef);
                } catch (e: any) {
                    if (e.code !== 'storage/object-not-found') {
                        console.warn("Could not delete old profile picture from storage:", e);
                    }
                }
            }
        }

        const uploadTask = uploadBytesResumable(imageRef, file);
        await uploadTask;
        newPhotoURL = await getDownloadURL(imageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: values.username,
        photoURL: newPhotoURL,
      });

      // Update Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        username: values.username,
        photoURL: newPhotoURL,
      });
      
      setCurrentUser(auth.currentUser); // Refresh current user state
      setFirestoreUser(prev => prev ? {...prev, username: values.username, photoURL: newPhotoURL} : null);
      if (values.profileImageFile && values.profileImageFile[0]) {
        form.reset({ username: values.username, profileImageFile: undefined }); // Reset file input
      }


      toast({ title: 'Perfil actualizado', description: 'Tu información de perfil ha sido guardada.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el perfil.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }

  if (!currentUser) {
    return <p>Por favor, inicia sesión para ver tu perfil.</p>; // Or redirect
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-xl animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <User size={28} /> Perfil de Usuario
        </CardTitle>
        <CardDescription>Administra la información de tu perfil y tu foto.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center space-y-4 animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-100">
            <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-md">
              <AvatarImage src={imagePreviewUrl || undefined} alt={currentUser.displayName || 'Avatar'} data-ai-hint="user avatar" />
              <AvatarFallback className="bg-muted">
                <User size={60} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Camera size={16} className="mr-2" /> Cambiar Foto
              </Button>
              {imagePreviewUrl && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm" disabled={isSubmitting}>
                      <Trash2 size={16} className="mr-2" /> Quitar Foto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar foto de perfil?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará tu foto de perfil. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={removeProfilePicture} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Controller
              name="profileImageFile"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="profileImageFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    handleImageChange(e);
                    field.onChange(e.target.files);
                  }}
                />
              )}
            />
            {form.formState.errors.profileImageFile && (
              <p className="text-sm text-destructive">{form.formState.errors.profileImageFile.message}</p>
            )}
          </div>

          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-200">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-1 text-primary/90"><Edit3 size={16}/> Nombre de Usuario</Label>
              <Controller
                name="username"
                control={form.control}
                render={({ field }) => <Input id="username" {...field} placeholder="Tu nombre de usuario" />}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1 text-primary/90"><Mail size={16}/> Correo Electrónico</Label>
              <Input id="email" type="email" value={currentUser.email || ''} disabled className="bg-muted/50"/>
            </div>

            {firestoreUser?.createdAt && (
                <div className="space-y-2">
                    <Label className="text-primary/90">Miembro Desde</Label>
                    <Input value={new Date(firestoreUser.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} disabled  className="bg-muted/50" />
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-300">
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
