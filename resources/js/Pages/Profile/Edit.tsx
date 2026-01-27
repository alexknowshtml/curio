import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-8 overflow-auto h-full">
                <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6">
                    <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Profile</h1>

                    <div className="bg-white dark:bg-stone-800 p-6 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white dark:bg-stone-800 p-6 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white dark:bg-stone-800 p-6 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
