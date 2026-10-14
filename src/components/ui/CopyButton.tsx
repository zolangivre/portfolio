'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { springPlayful } from '@/lib/motion/tokens'

type CopyButtonProps = {
  /** Accessible name before copying, e.g. "Copy email address". */
  ariaLabel: string
  copiedLabel: string
  failedLabel: string
  label: string
  value: string
}

type Status = 'idle' | 'copied' | 'failed'

/** How long "Copied" stays before the button returns to rest. */
const RESET_MS = 1800

function CopyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <rect height="13" rx="3" stroke="currentColor" strokeWidth="2" width="13" x="8" y="8" />
      <path
        d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

/**
 * Copies a value (the contact email) in one tap — quicker than a mailto: on
 * a computer with no mail app set up. Completion feedback, on the same
 * frame as the copy: the icon turns into a check on a little spring, the
 * label says so, a live region tells screen readers, and Android gets a
 * short tap of vibration. It settles back after a moment.
 */
export function CopyButton({ ariaLabel, copiedLabel, failedLabel, label, value }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const timerRef = useRef(0)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const copy = async () => {
    window.clearTimeout(timerRef.current)

    try {
      await navigator.clipboard.writeText(value)
      setStatus('copied')
      navigator.vibrate?.(10)
    } catch {
      setStatus('failed')
    }

    timerRef.current = window.setTimeout(() => setStatus('idle'), RESET_MS)
  }

  const text = status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : label

  return (
    <>
      <button
        // A fixed name: the outcome is announced once, by the live region
        // below — renaming the focused button too would say it twice.
        aria-label={ariaLabel}
        className="copy-button"
        data-status={status}
        onClick={copy}
        type="button"
      >
        <span className="relative inline-flex h-[15px] w-[15px]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 inline-flex"
              exit={{ opacity: 0, scale: 0.5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              key={status === 'copied' ? 'check' : 'copy'}
              transition={springPlayful}
            >
              {status === 'copied' ? <CheckIcon /> : <CopyIcon />}
            </motion.span>
          </AnimatePresence>
        </span>
        <span aria-hidden="true">{text}</span>
      </button>
      {/* Mounted from the start: a live region inserted with its text is
          often skipped by screen readers. */}
      <span className="sr-only" role="status">
        {status === 'idle' ? '' : text}
      </span>
    </>
  )
}
