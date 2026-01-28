import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-amber-600 shadow-sm focus:ring-amber-500 ' +
                className
            }
        />
    );
}
