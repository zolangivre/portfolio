'use client'

import { useActionState } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { submitContactForm, type ContactFormState } from '@/lib/actions/contact'

type ContactFormProps = {
  dictionary: Dictionary
  successMessage: string
}

const initialState: ContactFormState = { success: false }

export function ContactForm({ dictionary, successMessage }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)

  if (state.success) {
    return (
      <p className="text-sm font-medium text-fg" role="status">
        {successMessage}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
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
        <span className="mb-2 block">{dictionary.contact.formProjectLabel}</span>
        <textarea
          className="min-h-36 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
          name="message"
          placeholder={dictionary.contact.formProjectPlaceholder}
          required
        />
      </label>

      {state.error ? (
        <p className="text-sm font-medium text-red-500" role="alert">
          {dictionary.contact.errors[state.error] ?? dictionary.contact.errors['server-error']}
        </p>
      ) : null}

      <button
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? dictionary.contact.sendingLabel : dictionary.contact.submitLabel}
      </button>
    </form>
  )
}
