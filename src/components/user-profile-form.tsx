
// src/components/user-profile-form.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Added for login button
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updateProfile, User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase/config';
import type { FirestoreUser } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Edit3, Camera, Loader2, Save, Trash2, LockKeyhole, ShieldAlert, LogOut, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').max(50, 'El nombre de usuario no puede exceder los 50 caracteres.'),
  profileImageFile: z.custom<FileList>().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida.'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
  confirmNewPassword: z.string().min(6, 'Confirmar la nueva contraseña.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Las nuevas contraseñas no coinciden.',
  path: ['confirmNewPassword'],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

const getFileExtension = (filename: string) => filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

export function UserProfileForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = useState('');


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      profileImageFile: undefined,
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        profileForm.setValue('username', user.displayName || '');
        setImagePreviewUrl(user.photoURL);

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setFirestoreUser(userDocSnap.data() as FirestoreUser);
        }
      } else {
        // Instead of redirecting, allow page to load but with no user data
        setCurrentUser(null);
        setFirestoreUser(null);
        profileForm.reset({ username: '', profileImageFile: undefined });
        setImagePreviewUrl(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [profileForm, router]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Archivo inválido", description: "Por favor, selecciona un archivo de imagen." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El tamaño máximo de la imagen es 5MB." });
        return;
      }
      profileForm.setValue('profileImageFile', files, { shouldDirty: true });
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeProfilePicture = async () => {
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      const oldPhotoURL = currentUser.photoURL;
      await updateProfile(currentUser, { photoURL: null });
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL: null });
      
      if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = storageRef(storage, oldPhotoURL);
          await deleteObject(oldImageRef);
        } catch (storageError: any) {
          console.warn("Could not delete old profile picture from storage:", storageError);
        }
      }
      setImagePreviewUrl(null);
      setCurrentUser(auth.currentUser); 
      setFirestoreUser(prev => prev ? {...prev, photoURL: null} : null);
      profileForm.setValue('profileImageFile', undefined); // Clear the file input in the form state
      profileForm.reset({ username: profileForm.getValues('username'), profileImageFile: undefined });
      toast({ title: 'Foto de perfil eliminada', description: 'Tu foto de perfil ha sido eliminada.' });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la foto de perfil.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  async function onProfileSubmit(values: ProfileFormValues) {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar tu perfil.' });
        return;
    }
    setIsUpdatingProfile(true);

    let newPhotoURL: string | null = currentUser.photoURL;

    try {
      if (values.profileImageFile && values.profileImageFile[0]) {
        const file = values.profileImageFile[0];
        const extension = getFileExtension(file.name);
        const imageFileName = `profile_image.${extension}`;
        const imageRef = storageRef(storage, `profile-pictures/${currentUser.uid}/${imageFileName}`);
        
        const oldPhotoURL = currentUser.photoURL;
        if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
            if (values.profileImageFile) { 
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

      await updateProfile(currentUser, {
        displayName: values.username,
        photoURL: newPhotoURL,
      });

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        username: values.username,
        photoURL: newPhotoURL,
      });
      
      setCurrentUser(auth.currentUser); 
      setFirestoreUser(prev => prev ? {...prev, username: values.username, photoURL: newPhotoURL} : null);
      profileForm.reset({ username: values.username, profileImageFile: undefined }, { keepDirty: false });


      toast({ title: 'Perfil actualizado', description: 'Tu información de perfil ha sido guardada.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el perfil.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function onPasswordChangeSubmit(values: PasswordChangeFormValues) {
    if (!currentUser || !currentUser.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para cambiar tu contraseña.' });
        return;
    }
    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, values.newPassword);
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = 'No se pudo cambiar la contraseña.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'La contraseña actual es incorrecta.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      }
      passwordForm.setError('currentPassword', { type: 'manual', message: errorMessage });
      toast({ variant: 'destructive', title: 'Error al cambiar contraseña', description: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!currentUser || !currentUser.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para eliminar tu cuenta.' });
        return;
    }
    setIsDeletingAccount(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, deleteConfirmationPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Delete Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userDocRef);

      // Delete Storage files (profile picture)
      if (currentUser.photoURL && currentUser.photoURL.includes('firebasestorage.googleapis.com')) {
        try {
          const imageRef = storageRef(storage, currentUser.photoURL);
          await deleteObject(imageRef);
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            console.warn("Could not delete profile picture during account deletion:", storageError);
          }
        }
      }

      // Delete Auth user
      await deleteUser(currentUser);
      
      toast({ title: 'Cuenta eliminada', description: 'Tu cuenta ha sido eliminada permanentemente.' });
      setIsDeleteAccountDialogOpen(false);
      router.push('/login'); // Navigate to login page
    } catch (error: any) {
      console.error('Error deleting account:', error);
      let errorMessage = 'No se pudo eliminar la cuenta.';
       if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'La contraseña es incorrecta.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      }
      toast({ variant: 'destructive', title: 'Error al eliminar cuenta', description: errorMessage });
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmationPassword('');
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
    return (
      <Card className="max-w-2xl mx-auto shadow-xl animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <User size={28} /> Perfil de Usuario
          </CardTitle>
          <CardDescription>Administra la información de tu perfil y tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium mb-2">Acceso Restringido</p>
          <p className="text-muted-foreground mb-6">
            Debes iniciar sesión para ver y editar tu perfil.
          </p>
          <Link href="/login" passHref legacyBehavior>
            <Button>
              <LogOut className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }
  

  return (
    <Card className="max-w-2xl mx-auto shadow-xl animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <User size={28} /> Perfil de Usuario
        </CardTitle>
        <CardDescription>Administra la información de tu perfil y tu cuenta.</CardDescription>
      </CardHeader>
      
      {/* Profile Info Form */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
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
                    <Button type="button" variant="destructive" size="sm" disabled={isUpdatingProfile}>
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
                      <AlertDialogAction onClick={removeProfilePicture} disabled={isUpdatingProfile}>
                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Controller
              name="profileImageFile"
              control={profileForm.control}
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
            {profileForm.formState.errors.profileImageFile && (
              <p className="text-sm text-destructive">{profileForm.formState.errors.profileImageFile.message}</p>
            )}
          </div>

          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-200">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-1 text-primary/90"><Edit3 size={16}/> Nombre de Usuario</Label>
              <Controller
                name="username"
                control={profileForm.control}
                render={({ field }) => <Input id="username" {...field} placeholder="Tu nombre de usuario" />}
              />
              {profileForm.formState.errors.username && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.username.message}</p>
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
          <Button type="submit" disabled={isUpdatingProfile || !profileForm.formState.isDirty}>
            {isUpdatingProfile ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios de Perfil
          </Button>
        </CardFooter>
      </form>

      <Separator className="my-8" />

      {/* Password Change Section */}
      <CardContent className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-400">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary"><LockKeyhole size={20} /> Seguridad de la Cuenta</h3>
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Cambiar Contraseña</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)}>
              <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu contraseña actual y la nueva contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currentPasswordInput" className="text-right col-span-1">
                    Actual
                  </Label>
                  <div className="col-span-3">
                    <Controller
                      name="currentPassword"
                      control={passwordForm.control}
                      render={({ field }) => <Input id="currentPasswordInput" type="password" {...field} />}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPasswordInput" className="text-right col-span-1">
                    Nueva
                  </Label>
                  <div className="col-span-3">
                  <Controller
                    name="newPassword"
                    control={passwordForm.control}
                    render={({ field }) => <Input id="newPasswordInput" type="password" {...field} />}
                  />
                  {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmNewPasswordInput" className="text-right col-span-1">
                    Confirmar
                  </Label>
                  <div className="col-span-3">
                  <Controller
                    name="confirmNewPassword"
                    control={passwordForm.control}
                    render={({ field }) => <Input id="confirmNewPasswordInput" type="password" {...field} />}
                  />
                  {passwordForm.formState.errors.confirmNewPassword && (
                      <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setIsPasswordDialogOpen(false); passwordForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Contraseña
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
      
      <Separator className="my-8" />

      {/* Account Deletion Section */}
      <CardContent className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-500">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive"><ShieldAlert size={20} /> Zona de Peligro</h3>
        <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Eliminar Cuenta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cuenta permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Todos tus datos, incluyendo tu perfil y artículos guardados, serán eliminados.
                <br /><br />
                Para confirmar, por favor ingresa tu contraseña actual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="deleteConfirmPassword">Contraseña Actual</Label>
              <Input 
                id="deleteConfirmPassword" 
                type="password" 
                value={deleteConfirmationPassword}
                onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmationPassword('')}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount} 
                disabled={isDeletingAccount || deleteConfirmationPassword.length < 6}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sí, Eliminar Mi Cuenta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-sm text-muted-foreground">
          Una vez que eliminas tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
        </p>
      </CardContent>
    </Card>
  );
}

