import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={'text-sm text-rose-600 dark:text-rose-400 ' + className}
        >
            {message}
        </p>
    ) : null;
}
