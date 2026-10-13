import type { QuestionInput } from '../../shared/schemas'

/**
 * Minimal, tolerant QTI 2.1 importer.
 *
 * Scope: assessmentItems with choiceInteraction (→ mcq, or true/false when
 * the two options say so), textEntryInteraction (→ fill), and
 * orderInteraction (→ order). Anything else (match, hotspot, custom
 * interactions, uploads) is reported in `skipped` with a reason rather than
 * silently dropped.
 *
 * No XML dependency: QTI items are scanned structurally, namespace-agnostic.
 */

export interface QtiSkipped {
  title: string
  reason: string
}

export interface QtiParseResult {
  questions: QuestionInput[]
  skipped: QtiSkipped[]
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function stripMarkup(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

interface Attrs {
  [key: string]: string
}

function parseAttrs(source: string): Attrs {
  const attrs: Attrs = {}
  const re = /([\w.-]+)\s*=\s*"([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    attrs[match[1]] = decodeEntities(match[2])
  }
  return attrs
}

interface Declaration {
  identifier: string
  cardinality: string
  values: string[]
}

interface SimpleChoice {
  identifier: string
  label: string
}

/** Pull every `<assessmentItem>…</assessmentItem>` block, namespace-agnostic. */
function itemBlocks(xml: string): { title: string; body: string }[] {
  const blocks: { title: string; body: string }[] = []
  const open = /<([\w.-]*:)?assessmentItem\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = open.exec(xml)) !== null) {
    const tagEnd = match.index + match[0].length
    // Self-closing item: nothing to import.
    if (match[0].endsWith('/>')) continue
    const close = /<\/([\w.-]*:)?assessmentItem\s*>/i
    close.lastIndex = tagEnd
    const closer = close.exec(xml.slice(tagEnd))
    const end = closer ? tagEnd + closer.index : xml.length
    const body = xml.slice(tagEnd, end)
    blocks.push({
      title: parseAttrs(match[0]).title ?? '',
      body,
    })
    open.lastIndex = end
  }
  return blocks
}

function declarationsOf(body: string): Declaration[] {
  const declarations: Declaration[] = []
  const re =
    /<([\w.-]*:)?responseDeclaration\b([^>]*)>([\s\S]*?)<\/([\w.-]*:)?responseDeclaration\s*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(body)) !== null) {
    const attrs = parseAttrs(match[2])
    const values: string[] = []
    const valueRe = /<([\w.-]*:)?value\b[^>]*>([\s\S]*?)<\/([\w.-]*:)?value\s*>/gi
    let valueMatch: RegExpExecArray | null
    while ((valueMatch = valueRe.exec(match[3])) !== null) {
      values.push(decodeEntities(valueMatch[2]).trim())
    }
    if (attrs.identifier) {
      declarations.push({
        identifier: attrs.identifier,
        cardinality: (attrs.cardinality ?? 'single').toLowerCase(),
        values,
      })
    }
  }
  return declarations
}

function simpleChoicesOf(fragment: string): SimpleChoice[] {
  const choices: SimpleChoice[] = []
  const re =
    /<([\w.-]*:)?simpleChoice\b([^>]*)>([\s\S]*?)<\/([\w.-]*:)?simpleChoice\s*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(fragment)) !== null) {
    const attrs = parseAttrs(match[2])
    choices.push({
      identifier: attrs.identifier ?? String(choices.length),
      label: stripMarkup(match[3]),
    })
  }
  return choices
}

function interactionFor(
  body: string,
  name: 'choiceInteraction' | 'textEntryInteraction' | 'orderInteraction',
): { attrs: Attrs; content: string } | null {
  const re = new RegExp(
    `<([\\w.-]*:)?${name}\\b([^>]*?)(/>|>([\\s\\S]*?)<\\/([\\w.-]*:)?${name}\\s*>)`,
    'i',
  )
  const match = re.exec(body)
  if (!match) return null
  return { attrs: parseAttrs(match[2]), content: match[4] ?? '' }
}

/** Prompt = itemBody text before the first interaction. */
function promptOf(body: string): string {
  const bodyMatch =
    /<([\w.-]*:)?itemBody\b[^>]*>([\s\S]*?)<\/([\w.-]*:)?itemBody\s*>/i.exec(
      body,
    )
  const scope = bodyMatch ? bodyMatch[2] : body
  const firstInteraction = /<([\w.-]*:)?(choiceInteraction|textEntryInteraction|orderInteraction|matchInteraction|hotspotInteraction|sliderInteraction|inlineChoiceInteraction)\b/i.exec(
    scope,
  )
  const prefix = firstInteraction ? scope.slice(0, firstInteraction.index) : scope
  return stripMarkup(prefix)
}

function looksTrueFalse(options: string[]): boolean {
  if (options.length !== 2) return false
  const set = new Set(options.map((option) => option.trim().toLowerCase()))
  return set.has('true') && set.has('false')
}

function buildQuestion(
  title: string,
  body: string,
): QuestionInput | QtiSkipped {
  const declarations = declarationsOf(body)
  const declFor = (responseId: string | undefined): Declaration | undefined =>
    declarations.find((decl) => decl.identifier === responseId) ?? declarations[0]

  const choice = interactionFor(body, 'choiceInteraction')
  const entry = interactionFor(body, 'textEntryInteraction')
  const order = interactionFor(body, 'orderInteraction')
  const unsupported =
    /<([\w.-]*:)?(matchInteraction|hotspotInteraction|sliderInteraction|uploadInteraction|graphicGapMatchInteraction|gapMatchInteraction|associateInteraction)\b/i.exec(
      body,
    )

  if (unsupported) {
    return {
      title,
      reason: `unsupported interaction (${unsupported[2] ?? 'custom'})`,
    }
  }

  const prompt = promptOf(body)
  if (prompt.length < 3) {
    return { title, reason: 'no prompt text found before the interaction' }
  }

  if (order) {
    const choices = simpleChoicesOf(order.content)
    const decl = declFor(order.attrs.responseIdentifier)
    if (choices.length < 2 || !decl || decl.values.length !== choices.length) {
      return {
        title,
        reason: 'order interaction needs matching options and a full answer key',
      }
    }
    const correct: number[] = []
    for (const value of decl.values) {
      const index = choices.findIndex((option) => option.identifier === value)
      if (index === -1) {
        return { title, reason: 'answer key references an unknown option' }
      }
      correct.push(index)
    }
    if (new Set(correct).size !== correct.length) {
      return { title, reason: 'answer key is not a permutation of the options' }
    }
    const question: QuestionInput = {
      type: 'order',
      prompt,
      options: choices.map((option) => option.label),
      correct,
      points: 10,
      explanation: '',
    }
    return question
  }

  if (entry) {
    const decl = declFor(entry.attrs.responseIdentifier)
    const answer = decl?.values[0]?.trim()
    if (!answer) {
      return { title, reason: 'text-entry question has no expected answer' }
    }
    const question: QuestionInput = {
      type: 'fill',
      prompt,
      correct: answer,
      alternatives: decl!.values.slice(1).map((value) => value.trim()).filter(Boolean),
      points: 10,
      explanation: '',
    }
    return question
  }

  if (choice) {
    const choices = simpleChoicesOf(choice.content)
    const decl = declFor(choice.attrs.responseIdentifier)
    if (choices.length < 2) {
      return { title, reason: 'choice interaction needs at least two options' }
    }
    if (!decl || decl.values.length === 0) {
      return { title, reason: 'choice question has no correct response' }
    }
    const options = choices.map((option) => option.label)
    if (looksTrueFalse(options)) {
      const answer = decl.values[0].trim().toLowerCase()
      const question: QuestionInput = {
        type: 'truefalse',
        prompt,
        correct: answer === 'true',
        points: 10,
        explanation: '',
      }
      return question
    }
    const key = decl.values[0]
    const byIdentifier = choices.findIndex(
      (option) => option.identifier === key,
    )
    const correct =
      byIdentifier !== -1
        ? byIdentifier
        : Number(key) >= 0 && Number(key) < options.length
          ? Number(key)
          : -1
    if (correct === -1) {
      return { title, reason: 'correct response does not match any option' }
    }
    if (numberOfCorrect(decl, choices) > 1) {
      return { title, reason: 'multi-select questions are not supported yet' }
    }
    const question: QuestionInput = {
      type: 'mcq',
      prompt,
      options,
      correct,
      points: 10,
      explanation: '',
    }
    return question
  }

  return { title, reason: 'no importable interaction found' }
}

function numberOfCorrect(decl: Declaration, choices: SimpleChoice[]): number {
  return decl.values.filter(
    (value) =>
      choices.some((option) => option.identifier === value) ||
      (Number(value) >= 0 && Number(value) < choices.length),
  ).length
}

function isSkipped(value: QuestionInput | QtiSkipped): value is QtiSkipped {
  return !('type' in value)
}

/** Parse a QTI 2.1 XML document into OpenPath question inputs. */
export function parseQti(xml: string): QtiParseResult {
  const questions: QuestionInput[] = []
  const skipped: QtiSkipped[] = []

  for (const block of itemBlocks(xml)) {
    const result = buildQuestion(block.title || 'Untitled', block.body)
    if (isSkipped(result)) {
      skipped.push(result)
    } else {
      questions.push(result)
    }
  }

  return { questions, skipped }
}
