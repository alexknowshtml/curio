import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { format } from 'date-fns';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    entries_count: number;
}

interface Props {
    users: User[];
}

export default function Users({ users }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        editForm.patch(route('admin.users.update', editingUser.id), {
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingUser) return;
        router.delete(route('admin.users.destroy', deletingUser.id), {
            onSuccess: () => setDeletingUser(null),
        });
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Users" />

            <div className="h-full overflow-auto">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                            User Management
                        </h1>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Add User
                        </button>
                    </div>

                    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-stone-50 dark:bg-stone-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                        Entries
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/30">
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="font-medium text-stone-900 dark:text-stone-100">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-stone-500 dark:text-stone-400">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-stone-600 dark:text-stone-300">
                                            {user.entries_count}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-stone-500 dark:text-stone-400">
                                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-4 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="md">
                <form onSubmit={handleCreate} className="p-6">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
                        Add New User
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="create-name" value="Name" />
                            <TextInput
                                id="create-name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={createForm.errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create-email" value="Email" />
                            <TextInput
                                id="create-email"
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={createForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create-password" value="Password" />
                            <TextInput
                                id="create-password"
                                type="password"
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData('password', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={createForm.errors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create-password-confirm" value="Confirm Password" />
                            <TextInput
                                id="create-password-confirm"
                                type="password"
                                value={createForm.data.password_confirmation}
                                onChange={(e) => createForm.setData('password_confirmation', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="btn-primary"
                        >
                            {createForm.processing ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="md">
                <form onSubmit={handleEdit} className="p-6">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
                        Edit User
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="edit-name" value="Name" />
                            <TextInput
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={editForm.errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-email" value="Email" />
                            <TextInput
                                id="edit-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData('email', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={editForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-password" value="New Password (leave blank to keep current)" />
                            <TextInput
                                id="edit-password"
                                type="password"
                                value={editForm.data.password}
                                onChange={(e) => editForm.setData('password', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={editForm.errors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-password-confirm" value="Confirm New Password" />
                            <TextInput
                                id="edit-password-confirm"
                                type="password"
                                value={editForm.data.password_confirmation}
                                onChange={(e) => editForm.setData('password_confirmation', e.target.value)}
                                className="mt-1 block w-full"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="btn-primary"
                        >
                            {editForm.processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={!!deletingUser} onClose={() => setDeletingUser(null)} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                        Delete User
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400">
                        Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This will also delete all their entries. This action cannot be undone.
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setDeletingUser(null)}
                            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        >
                            Delete User
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
