'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, useEffect, useRef, useState } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { buttonClassName } from '@/components/ui/Button'
import { submitContactForm, type ContactField, type ContactFormState } from '@/lib/actions/contact'
import { DURATION_BASE, DURATION_FAST, DURATION_UI, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

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
  const formRef = useRef<HTMLFormElement>(null)
  const formHeightRef = useRef(0)
  const [lockedHeight, setLockedHeight] = useState<number | undefined>(undefined)
  const errorMessage = state.error
    ? (dictionary.contact.errors[state.error] ?? dictionary.contact.errors['server-error'])
    : null

  // Remembers the form's rendered height so the success state can occupy the
  // same space — the card keeps its size instead of collapsing to one line.
  useEffect(() => {
    const form = formRef.current

    if (!form) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      formHeightRef.current = entry.borderBoxSize[0]?.blockSize ?? form.offsetHeight
    })

    observer.observe(form)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (state.success && formHeightRef.current > 0) {
      setLockedHeight(formHeightRef.current)
    }
  }, [state.success])

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
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 text-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="success"
            style={{ minHeight: lockedHeight }}
            transition={fadeTransition}
          >
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent"
              initial={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            >
              <svg fill="none" height="26" viewBox="0 0 24 24" width="26">
                <motion.path
                  animate={{ pathLength: 1 }}
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={{ pathLength: 0 }}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  transition={{ delay: 0.15, duration: 0.4, ease: EASE_OUT_PREMIUM }}
                />
              </svg>
            </motion.span>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xs text-base font-medium text-fg"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.25, duration: DURATION_UI, ease: EASE_OUT_PREMIUM }}
            >
              {successMessage}
            </motion.p>
          </motion.div>
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
