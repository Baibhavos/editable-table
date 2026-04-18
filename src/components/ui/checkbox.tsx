import * as React from 'react'

import { cx } from '../../lib/utils'

export type CheckboxProps = Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'type' | 'checked' | 'defaultChecked' | 'onChange'
> & {
    checked?: boolean | 'indeterminate'
    onCheckedChange?: (checked: boolean) => void
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
    return (value: T) => {
        for (const ref of refs) {
            if (ref == null) continue
            if (typeof ref === 'function') (ref as React.RefCallback<T>)(value)
            else (ref as React.MutableRefObject<T | null>).current = value
        }
    }
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, disabled, ...rest }, ref) => {
        const innerRef = React.useRef<HTMLInputElement>(null)
        const wasIndeterminateRef = React.useRef(false)

        React.useEffect(() => {
            const el = innerRef.current
            if (!el) return
            el.indeterminate = checked === 'indeterminate'
            wasIndeterminateRef.current = checked === 'indeterminate'
        }, [checked])

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const el = e.currentTarget
            // Native first click from indeterminate clears to unchecked; treat as "select all".
            if (wasIndeterminateRef.current && el.checked === false) {
                onCheckedChange?.(true)
                return
            }
            onCheckedChange?.(el.checked)
        }

        const boolChecked = checked === undefined ? undefined : checked === 'indeterminate' ? false : checked

        return (
            <span className={cx('ert-checkbox-root', className)}>
                <input
                    {...rest}
                    ref={mergeRefs(innerRef, ref)}
                    type="checkbox"
                    className="ert-checkbox-input"
                    disabled={disabled}
                    checked={boolChecked}
                    onChange={onChange}
                />
                <span className="ert-checkbox-box" aria-hidden>
                    <svg className="ert-checkbox-icon ert-checkbox-icon--check" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <svg className="ert-checkbox-icon ert-checkbox-icon--minus" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </span>
            </span>
        )
    },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
