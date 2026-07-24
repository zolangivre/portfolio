'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { useMagneticHover } from '@/hooks/useMagneticHover'
import { submitContactForm, type ContactFormState } from '@/lib/actions/contact'

type ContactFormProps = {
  dictionary: Dictionary
  successMessage: string
}

const initialState: ContactFormState = { success: false }

const fadeTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }

const fieldContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export function ContactForm({ dictionary, successMessage }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)
  const submitRef = useMagneticHover<HTMLButtonElement>(0.25, 8)

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
          animate="visible"
          className="space-y-4"
          exit={{ opacity: 0, y: -8 }}
          initial="hidden"
          key="form"
          variants={fieldContainerVariants}
        >
          <input
            aria-hidden="true"
            className="hidden"
            name="company"
            tabIndex={-1}
            type="text"
            autoComplete="off"
          />
          <motion.div className="grid gap-4 sm:grid-cols-2" variants={fieldVariants}>
            <label className="block text-sm text-fg-muted">
              <span className="mb-2 block">{dictionary.contact.formNameLabel}</span>
              <input
                className="w-full rounded-full border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
                name="name"
                placeholder={dictionary.contact.formNamePlaceholder}
                required
              />
            </label>
            <label className="block text-sm text-fg-muted">
              <span className="mb-2 block">{dictionary.contact.formEmailLabel}</span>
              <input
                className="w-full rounded-full border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
                name="email"
                placeholder={dictionary.contact.formEmailPlaceholder}
                required
                type="email"
              />
            </label>
          </motion.div>
          <motion.label className="block text-sm text-fg-muted" variants={fieldVariants}>
            <span className="mb-2 block">{dictionary.contact.formMessageLabel}</span>
            <textarea
              className="min-h-36 w-full rounded-4xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent-soft-border"
              name="message"
              placeholder={dictionary.contact.formMessagePlaceholder}
              required
            />
          </motion.label>

          <motion.div className="min-h-5" variants={fieldVariants}>
            {state.error ? (
              <p className="text-sm font-medium text-red-500" role="alert">
                {dictionary.contact.errors[state.error] ??
                  dictionary.contact.errors['server-error']}
              </p>
            ) : null}
          </motion.div>

          <motion.button
            className="btn-cta rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.04] active:scale-[0.97] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            ref={submitRef}
            type="submit"
            variants={fieldVariants}
          >
            {pending ? dictionary.contact.sendingLabel : dictionary.contact.submitLabel}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
