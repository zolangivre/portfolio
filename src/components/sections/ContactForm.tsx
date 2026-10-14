'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, useEffect, useRef, useState } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { buttonClassName } from '@/components/ui/Button'
import { submitContactForm, type ContactFormState } from '@/lib/actions/contact'
import {
  contactFieldProblem,
  type ContactField,
  type ContactFieldProblem,
} from '@/lib/contactValidation'
import { DURATION_BASE, DURATION_FAST, DURATION_UI, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

/*
 * Fields keep the global :focus-visible ring (2px accent outline, which
 * every browser shows on a focused text input) instead of `outline-none` —
 * the border change alone was ~1.4:1 against the field and failed WCAG's
 * 3:1 for focus indicators. The border still turns accent as a second cue.
 */
const FIELD_CLASSNAME =
  'w-full border border-border bg-surface px-4 py-3 text-sm text-fg transition focus:border-accent aria-invalid:border-danger'

const FIELDS: ContactField[] = ['name', 'email', 'message']

type Problems = Partial<Record<ContactField, ContactFieldProblem>>

/**
 * A field's own error line. Its room is always reserved — one line under the
 * field, empty while all is well — so a message appearing or going away
 * never pushes the rest of the form down mid-typing. The message itself
 * fades and settles into that line; a different message cross-fades in.
 */
function FieldError({ id, message }: { id: string; message: string | null }) {
  return (
    <span className="relative block min-h-5 pt-1 pl-4">
      <AnimatePresence initial={false}>
        {message ? (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-1 right-0 left-4 block text-xs font-medium text-danger"
            exit={{ opacity: 0, y: -2 }}
            id={id}
            initial={{ opacity: 0, y: -4 }}
            key={message}
            transition={{ duration: DURATION_UI, ease: EASE_OUT_PREMIUM }}
          >
            {message}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}

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
  // Checked in the browser as the visitor goes: a field is judged when they
  // leave it (not while they're still typing it), and once it's been judged
  // its error clears the moment the input becomes valid.
  const [problems, setProblems] = useState<Problems>({})
  const touchedRef = useRef(new Set<ContactField>())
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

    // A short tap under the finger as the check appears — Android only (iOS
    // has no web vibration), and only for this one moment that matters.
    if (state.success) {
      navigator.vibrate?.(12)
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

  const check = (field: ContactField, value: string) => {
    const problem = contactFieldProblem(field, value)

    setProblems((current) =>
      current[field] === (problem ?? undefined)
        ? current
        : { ...current, [field]: problem ?? undefined },
    )
  }

  // Leaving a field is when it's judged; typing only ever clears an error
  // already shown (or swaps it for the right one), never raises a new one.
  // Both read the field from the element's `name`.
  const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.currentTarget.name as ContactField

    touchedRef.current.add(field)
    check(field, event.currentTarget.value)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.currentTarget.name as ContactField

    if (touchedRef.current.has(field)) {
      check(field, event.currentTarget.value)
    }
  }

  // Everything still wrong at submit is shown at once, and focus goes to the
  // first of it; the server action never runs on a form we know is invalid.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    const found: Problems = {}

    for (const field of FIELDS) {
      const element = form.elements.namedItem(field)
      const problem =
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
          ? contactFieldProblem(field, element.value)
          : null

      touchedRef.current.add(field)

      if (problem) {
        found[field] = problem
      }
    }

    setProblems(found)

    const first = FIELDS.find((field) => found[field])

    if (first) {
      event.preventDefault()
      const element = form.elements.namedItem(first)

      if (element instanceof HTMLElement) {
        element.focus()
      }
    }
  }

  const fieldErrorProps = (field: ContactField) => {
    if (problems[field]) {
      return { 'aria-describedby': `contact-${field}-error`, 'aria-invalid': true as const }
    }

    return state.field === field
      ? { 'aria-describedby': 'contact-form-error', 'aria-invalid': true as const }
      : {}
  }

  const problemMessage = (field: ContactField) => {
    const problem = problems[field]

    return problem ? dictionary.contact.fieldErrors[problem] : null
  }

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
            className="space-y-1"
            exit={{ opacity: 0, y: -8 }}
            initial="hidden"
            key="form"
            // Our own inline messages replace the browser's bubbles.
            noValidate
            onSubmit={handleSubmit}
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
            <motion.div className="grid gap-x-4 gap-y-1 sm:grid-cols-2" variants={fieldVariants}>
              <div>
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
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...fieldErrorProps('name')}
                  />
                </label>
                <FieldError id="contact-name-error" message={problemMessage('name')} />
              </div>
              <div>
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
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...fieldErrorProps('email')}
                  />
                </label>
                <FieldError id="contact-email-error" message={problemMessage('email')} />
              </div>
            </motion.div>
            <motion.div variants={fieldVariants}>
              <label className="block text-sm text-fg-muted">
                <span className="mb-2 block">{dictionary.contact.formMessageLabel}</span>
                <textarea
                  className={`${FIELD_CLASSNAME} min-h-36 rounded-4xl`}
                  defaultValue={state.values?.message}
                  maxLength={5000}
                  name="message"
                  placeholder={dictionary.contact.formMessagePlaceholder}
                  required
                  onBlur={handleBlur}
                  onChange={handleChange}
                  {...fieldErrorProps('message')}
                />
              </label>
              <FieldError id="contact-message-error" message={problemMessage('message')} />
            </motion.div>

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
