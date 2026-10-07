'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, useEffect, useRef } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { buttonClassName } from '@/components/ui/Button'
import { useMagneticHover } from '@/hooks/useMagneticHover'
import { submitContactForm, type ContactField, type ContactFormState } from '@/lib/actions/contact'
import { DURATION_BASE, DURATION_FAST, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

/*
 * Fields keep the global :focus-visible ring (2px accent outline, which
 * every browser shows on a focused text input) instead of `outline-none` —
 * the border change alone was ~1.4:1 against the field and failed WCAG's
 * 3:1 for focus indicators. The border still turns accent as a second cue.
 */
const FIELD_CLASSNAME =
  'w-full border border-border bg-surface px-4 py-3 text-sm text-fg transition focus:border-accent'

type ContactFormProps = {
  dictionary: Dictionary
  successMessage: string
}

const initialState: ContactFormState = { success: false }

const fadeTransition = { duration: DURATION_FAST, ease: EASE_OUT_PREMIUM }

const fieldContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION_BASE, ease: EASE_OUT_PREMIUM } },
}

export function ContactForm({ dictionary, successMessage }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)
  const submitRef = useMagneticHover<HTMLButtonElement>(0.25, 8)
  const formRef = useRef<HTMLFormElement>(null)
  const errorMessage = state.error
    ? (dictionary.contact.errors[state.error] ?? dictionary.contact.errors['server-error'])
    : null

  // Sends the visitor straight to the field that needs fixing; its
  // aria-describedby then reads the error out.
  useEffect(() => {
    if (state.field) {
      const field = formRef.current?.elements.namedItem(state.field)

      if (field instanceof HTMLElement) {
        field.focus()
      }
    }
  }, [state])

  const fieldErrorProps = (field: ContactField) =>
    state.field === field
      ? { 'aria-describedby': 'contact-form-error', 'aria-invalid': true as const }
      : {}

  return (
    <>
      {/* Mounted from the start: a live region inserted together with its
          text is often skipped by screen readers. */}
      <p className="sr-only" role="status">
        {state.success ? successMessage : ''}
      </p>
      <AnimatePresence mode="wait">
        {state.success ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-fg"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 8 }}
            key="success"
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
            ref={formRef}
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
                  autoComplete="name"
                  className={`${FIELD_CLASSNAME} rounded-full`}
                  defaultValue={state.values?.name}
                  maxLength={120}
                  name="name"
                  placeholder={dictionary.contact.formNamePlaceholder}
                  required
                  {...fieldErrorProps('name')}
                />
              </label>
              <label className="block text-sm text-fg-muted">
                <span className="mb-2 block">{dictionary.contact.formEmailLabel}</span>
                <input
                  autoComplete="email"
                  className={`${FIELD_CLASSNAME} rounded-full`}
                  defaultValue={state.values?.email}
                  maxLength={254}
                  name="email"
                  placeholder={dictionary.contact.formEmailPlaceholder}
                  required
                  spellCheck={false}
                  type="email"
                  {...fieldErrorProps('email')}
                />
              </label>
            </motion.div>
            <motion.label className="block text-sm text-fg-muted" variants={fieldVariants}>
              <span className="mb-2 block">{dictionary.contact.formMessageLabel}</span>
              <textarea
                className={`${FIELD_CLASSNAME} min-h-36 rounded-4xl`}
                defaultValue={state.values?.message}
                maxLength={5000}
                name="message"
                placeholder={dictionary.contact.formMessagePlaceholder}
                required
                {...fieldErrorProps('message')}
              />
            </motion.label>

            <motion.div className="min-h-5" variants={fieldVariants}>
              {errorMessage ? (
                // A field error is announced through the focused field's
                // aria-describedby; only a form-level one needs to interrupt.
                <p
                  className="text-sm font-medium text-danger"
                  id="contact-form-error"
                  role={state.field ? undefined : 'alert'}
                >
                  {errorMessage}
                </p>
              ) : null}
            </motion.div>

            <motion.button
              className={buttonClassName()}
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
    </>
  )
}
