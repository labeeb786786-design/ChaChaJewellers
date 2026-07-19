"use client";

import { useState } from "react";
import {
  Recycle,
  Layers,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Phone,
  Scale,
  Info,
  Plus,
  Minus,
  CalendarCheck,
  X,
} from "lucide-react";
import Link from "next/link";

import { formatGBP } from "@/lib/gold";
import { SITE } from "@/lib/site";

/*
 * Sell Your Gold — instant valuation estimator (single page, multi-step).
 *
 * Pricing model (kept internal — the customer never sees the market rate or the
 * deduction, only the final offer):
 *   marketPerGram(karat) = spot24kPerGram * (karat / 24)
 *   offer = marketPerGram * weightInGrams * factor
 *   factor: SCRAP = 0.80 · BAR = 0.95
 *
 * spot24kPerGram is a MOCK reference (lib/data/gold-prices.json). Swap the
 * source in lib/gold.ts for a live metals API to make this a real quote.
 */

type GoldType = "scrap" | "bar";
type Step = "type" | "weight" | "karat" | "result";

const TYPE_FACTOR: Record<GoldType, number> = { scrap: 0.8, bar: 0.95 };

const TYPE_META: Record<GoldType, { label: string; blurb: string }> = {
  scrap: {
    label: "Scrap Gold",
    blurb: "Broken chains, odd earrings, old or unwanted gold jewellery.",
  },
  bar: {
    label: "Gold Bar(s)",
    blurb: "Investment bars and bullion in good condition.",
  },
};

const STEP_ORDER: Step[] = ["type", "weight", "karat", "result"];

// Weight units and their conversion to grams (calculation is always in grams).
const UNITS = [
  { id: "g", label: "Grams", short: "g", toGrams: 1, step: 1 },
  { id: "kg", label: "Kilograms", short: "kg", toGrams: 1000, step: 0.01 },
  { id: "tola", label: "Tola", short: "tola", toGrams: 11.6638, step: 0.1 },
] as const;

type UnitId = (typeof UNITS)[number]["id"];

const PRESET_KARATS = [9, 14, 18, 22, 24];

// Shared estimate disclaimer — used on the result screen AND the confirm modal.
const DISCLAIMER =
  "This is an indicative estimate based on today's gold prices. Your final offer can only be confirmed in-store, once our team has professionally weighed and tested your gold.";

export function GoldCalculator({
  spot24kPerGram,
}: {
  spot24kPerGram: number;
}) {
  const [step, setStep] = useState<Step>("type");
  const [goldType, setGoldType] = useState<GoldType | null>(null);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<UnitId>("g");
  const [karat, setKarat] = useState<number | null>(null);
  const [karatMode, setKaratMode] = useState<"preset" | "custom">("preset");
  const [customKarat, setCustomKarat] = useState("");
  const [weightError, setWeightError] = useState("");
  const [karatError, setKaratError] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "call" | "appointment">(
    null
  );

  const weightNum = parseFloat(weight);
  const stepIndex = STEP_ORDER.indexOf(step);
  const activeUnit = UNITS.find((u) => u.id === unit)!;

  function goBack() {
    if (step === "weight") setStep("type");
    else if (step === "karat") setStep("weight");
    else if (step === "result") setStep("karat");
  }

  function reset() {
    setStep("type");
    setGoldType(null);
    setWeight("");
    setUnit("g");
    setKarat(null);
    setKaratMode("preset");
    setCustomKarat("");
    setWeightError("");
    setKaratError("");
    setConfirmAction(null);
  }

  function chooseType(t: GoldType) {
    setGoldType(t);
    setStep("weight");
  }

  function stepWeight(dir: 1 | -1) {
    const current = isNaN(weightNum) ? 0 : weightNum;
    const next = Math.max(0, +(current + dir * activeUnit.step).toFixed(3));
    setWeight(String(next));
    setWeightError("");
  }

  function submitWeight() {
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      setWeightError("Please enter a weight greater than 0.");
      return;
    }
    setWeightError("");
    setStep("karat");
  }

  function choosePresetKarat(k: number) {
    setKaratMode("preset");
    setKarat(k);
    setStep("result");
  }

  function submitCustomKarat() {
    const k = parseFloat(customKarat);
    if (!customKarat || isNaN(k) || k <= 0 || k > 24) {
      setKaratError("Enter a karat between 1 and 24.");
      return;
    }
    setKaratError("");
    setKarat(k);
    setStep("result");
  }

  // Final valuation (internal maths only — deduction is never surfaced).
  const weightInGrams = (weightNum || 0) * activeUnit.toGrams;
  const marketPerGram = karat != null ? spot24kPerGram * (karat / 24) : 0;
  const factor = goldType ? TYPE_FACTOR[goldType] : 0;
  const offer = marketPerGram * weightInGrams * factor;

  const karatLabel = karat != null ? `${karat}k` : "";

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress */}
      {step !== "result" && (
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEP_ORDER.slice(0, 3).map((s, i) => (
            <span
              key={s}
              className={
                "h-1.5 rounded-full transition-all " +
                (i <= stepIndex ? "w-10 bg-gold" : "w-6 bg-gold/20")
              }
            />
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-gold/40 bg-gradient-to-b from-white to-cream-soft/60 p-6 shadow-[0_25px_70px_-25px_rgba(166,124,26,0.45)] ring-1 ring-white/60 sm:p-8">
        {/* STEP 1 — TYPE */}
        {step === "type" && (
          <div>
            <StepHeader
              n="Step 1 of 3"
              title="What are you selling?"
              subtitle="Choose the type of gold you'd like us to value."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(["scrap", "bar"] as GoldType[]).map((t) => {
                const Icon = t === "scrap" ? Recycle : Layers;
                return (
                  <button
                    key={t}
                    onClick={() => chooseType(t)}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
                  >
                    <span className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-charcoal">
                      <Icon className="size-6" />
                    </span>
                    <span className="font-serif text-lg font-semibold text-charcoal">
                      {TYPE_META[t].label}
                    </span>
                    <span className="text-sm text-foreground/60">
                      {TYPE_META[t].blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — WEIGHT */}
        {step === "weight" && (
          <div>
            <StepHeader
              n="Step 2 of 3"
              title="How much does it weigh?"
              subtitle={`Enter the total weight of your ${
                goldType ? TYPE_META[goldType].label.toLowerCase() : "gold"
              }.`}
            />

            {/* Unit selector */}
            <div className="mt-6 flex gap-1.5 rounded-full border border-border bg-cream-soft p-1">
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUnit(u.id);
                    setWeightError("");
                  }}
                  className={
                    "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors " +
                    (unit === u.id
                      ? "bg-gold text-charcoal shadow-sm"
                      : "text-foreground/60 hover:text-charcoal")
                  }
                >
                  {u.label}
                </button>
              ))}
            </div>

            {/* Stepper input */}
            <div className="mt-4 flex items-stretch gap-2.5">
              <StepperButton ariaLabel="Decrease weight" onClick={() => stepWeight(-1)}>
                <Minus className="size-5" />
              </StepperButton>

              <div className="relative flex-1">
                <Scale className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold-deep" />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={activeUnit.step}
                  autoFocus
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWeight()}
                  placeholder="0.0"
                  className="no-spinner w-full rounded-xl border border-border bg-white py-4 pl-12 pr-16 text-center text-lg font-semibold text-charcoal outline-none transition-colors focus:border-gold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/40">
                  {activeUnit.short}
                </span>
              </div>

              <StepperButton ariaLabel="Increase weight" onClick={() => stepWeight(1)}>
                <Plus className="size-5" />
              </StepperButton>
            </div>

            {weightError && (
              <p className="mt-2 text-sm text-red-600">{weightError}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <BackButton onClick={goBack} />
              <NextButton onClick={submitWeight} />
            </div>
          </div>
        )}

        {/* STEP 3 — KARAT */}
        {step === "karat" && (
          <div>
            <StepHeader
              n="Step 3 of 3"
              title="What karat is your gold?"
              subtitle="Not sure? We'll confirm the exact purity when you visit — pick your best estimate or enter it exactly."
            />
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {PRESET_KARATS.map((k) => (
                <button
                  key={k}
                  onClick={() => choosePresetKarat(k)}
                  className="rounded-xl border border-border bg-white py-4 font-serif text-lg font-semibold text-charcoal shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-charcoal"
                >
                  {k}k
                </button>
              ))}
              <button
                onClick={() => {
                  setKaratMode("custom");
                  setKaratError("");
                }}
                className={
                  "rounded-xl border py-4 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 " +
                  (karatMode === "custom"
                    ? "border-gold bg-gold/10 text-gold-deep"
                    : "border-border bg-white text-charcoal hover:border-gold hover:text-gold-deep")
                }
              >
                Other
              </button>
            </div>

            {/* Custom karat entry */}
            {karatMode === "custom" && (
              <div className="mt-4 rounded-xl border border-gold/30 bg-cream-soft p-4">
                <label className="text-sm font-medium text-charcoal/80">
                  Enter exact karat (1–24)
                </label>
                <div className="mt-2 flex gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="24"
                      step="0.1"
                      autoFocus
                      value={customKarat}
                      onChange={(e) => setCustomKarat(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitCustomKarat()}
                      placeholder="e.g. 21.6"
                      className="no-spinner w-full rounded-xl border border-border bg-white py-3 pl-4 pr-14 text-charcoal outline-none transition-colors focus:border-gold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/40">
                      karat
                    </span>
                  </div>
                  <button
                    onClick={submitCustomKarat}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-deep hover:text-cream"
                  >
                    Value
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                {karatError && (
                  <p className="mt-2 text-sm text-red-600">{karatError}</p>
                )}
              </div>
            )}

            <div className="mt-6">
              <BackButton onClick={goBack} />
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && goldType && karat != null && (
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
              We value your gold at the price:
            </p>
            <p className="mt-4 font-serif text-5xl font-bold text-maroon sm:text-6xl">
              {formatGBP(offer, 0)}
            </p>

            <div className="mx-auto mt-7 max-w-sm space-y-2.5 rounded-2xl border border-border bg-cream-soft p-5 text-left text-sm">
              <Row label="Type" value={TYPE_META[goldType].label} />
              <Row label="Weight" value={`${weightNum} ${activeUnit.short}`} />
              <Row label="Purity" value={`${karatLabel} gold`} />
            </div>

            <div className="mx-auto mt-5 flex max-w-sm items-start gap-2 rounded-xl border border-gold/30 bg-gold/8 p-3.5 text-left text-xs text-foreground/70">
              <Info className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <p>{DISCLAIMER}</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setConfirmAction("appointment")}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold-deep hover:text-cream"
              >
                <CalendarCheck className="size-4" />
                Book an appointment
              </button>
              <button
                onClick={() => setConfirmAction("call")}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold-deep hover:text-cream"
              >
                <Phone className="size-4" />
                Call to confirm
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-gold hover:text-gold-deep"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-gold hover:text-gold-deep"
              >
                <RotateCcw className="size-4" />
                Start again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal — repeats the estimate warning before calling OR booking */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-gold/40 bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setConfirmAction(null)}
              className="absolute right-3 top-3 text-foreground/40 transition-colors hover:text-gold-deep"
            >
              <X className="size-5" />
            </button>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
              <Info className="size-6" />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold text-charcoal">
              {confirmAction === "call" ? "Before you call" : "Before you book"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {DISCLAIMER}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-gold hover:text-gold-deep"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              {confirmAction === "call" ? (
                <a
                  href={SITE.phoneHref}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-deep hover:text-cream"
                >
                  <Phone className="size-4" />
                  Continue
                </a>
              ) : (
                <Link
                  href="/appointments"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-deep hover:text-cream"
                >
                  <CalendarCheck className="size-4" />
                  Continue
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({
  n,
  title,
  subtitle,
}: {
  n: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
        {n}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-charcoal">{title}</h2>
      <p className="mt-1.5 text-sm text-foreground/60">{subtitle}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-foreground/60">
      <span>{label}</span>
      <span className="font-semibold text-charcoal">{value}</span>
    </div>
  );
}

function StepperButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex w-14 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold-deep transition-all hover:bg-gold hover:text-charcoal active:scale-95"
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-gold hover:text-gold-deep"
    >
      <ArrowLeft className="size-4" />
      Back
    </button>
  );
}

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold-deep hover:text-cream"
    >
      Next
      <ArrowRight className="size-4" />
    </button>
  );
}
