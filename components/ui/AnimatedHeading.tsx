"use client";

import { ElementType } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";

type AnimatedHeadingProps = {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  once?: boolean;
};

/**
 * Line-by-line mask reveal for large display headings.
 * Split by " / " to force explicit line breaks.
 */
export default function AnimatedHeading({
  text,
  className = "",
  as: Tag = "h2",
  delay = 0,
  once = true,
}: AnimatedHeadingProps) {
  const reduce = useReducedMotion();
  const lines = text.split(" / ");

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.1, delayChildren: delay },
    },
  };

  const line: Variants = {
    hidden: { y: "115%" },
    show: {
      y: "0%",
      transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (reduce) {
    return <Tag className={className}>{lines.join(" ")}</Tag>;
  }

  return (
    <Tag className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: "-12% 0px" }}
        className="block"
      >
        {lines.map((l, i) => (
          <span key={i} className="mask-line">
            <motion.span variants={line} className="block">
              {l}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
