'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { submitContactForm, type ContactFormState } from '@/lib/actions/contact'

type ContactFormProps = {
  dictionary: Dictionary
  successMessage: string
}

const initialState: ContactFormState = { success: false }

const fadeTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }

export function ContactForm({ dictionary, successMessage }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)

  return (
    <AnimatePresence mode="wait">
      {state.success ? (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-fg"
          exit={{ opacity: 0, y: -8 }}
          initial={{ opacity: 0, y: 8 }}
          key="success"
          role="status"
          transition={fadeTransition}
        >
          {successMessage}
        </motion.p>
      ) : (
        <motion.form
          action={formAction}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
          exit={{ opacity: 0, y: -8 }}
          initial={{ opacity: 0, y: 8 }}
          key="form"
          transition={fadeTransition}
        >
          <input
            aria-hidden="true"
            className="hidden"
            name="company"
            tabIndex={-1}
            type="text"
            autoComplete="off"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-fg-muted">
              <span className="mb-2 block">{dictionary.contact.formNameLabel}</span>
              <input
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
                name="name"
                placeholder={dictionary.contact.formNamePlaceholder}
                required
              />
            </label>
            <label className="block text-sm text-fg-muted">
              <span className="mb-2 block">{dictionary.contact.formEmailLabel}</span>
              <input
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
                name="email"
                placeholder={dictionary.contact.formEmailPlaceholder}
                required
                type="email"
              />
            </label>
          </div>
          <label className="block text-sm text-fg-muted">
            <span className="mb-2 block">{dictionary.contact.formMessageLabel}</span>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
              name="message"
              placeholder={dictionary.contact.formMessagePlaceholder}
              required
            />
          </label>

          <div className="min-h-5">
            {state.error ? (
              <p className="text-sm font-medium text-red-500" role="alert">
                {dictionary.contact.errors[state.error] ??
                  dictionary.contact.errors['server-error']}
              </p>
            ) : null}
          </div>

          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition active:scale-[0.97] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? dictionary.contact.sendingLabel : dictionary.contact.submitLabel}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
