import React from "react";

/**
 * Circular progress indicator for tasks completed out of total.
 * @param {{ total: number, completed: number }} props
 */
const ProgressCircle = ({ total, completed }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentage (avoid division by zero)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate the stroke-dashoffset: how much of the ring is "empty"
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="progress-container"
      style={{ textAlign: "center", padding: "10px" }}
    >
      <svg width="80" height="80" role="img" aria-label="Task completion progress">
        {/* Background Circle (Gray) */}
        <circle
          stroke="#e6e6e6"
          strokeWidth="6"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        {/* Progress Circle (Blue) */}
        <circle
          stroke="#007bff"
          strokeWidth="6"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.5s ease",
          }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="bold">
          {percentage}%
        </text>
      </svg>
      <p style={{ margin: "5px 0", fontSize: "12px" }}>
        {completed} of {total} tasks done
      </p>
    </div>
  );
};

export default ProgressCircle;
