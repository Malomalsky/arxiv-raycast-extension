import { isThisWeek, isToday, isYesterday, format } from "date-fns";
import { ArxivPaper } from "../types";

export function groupPapersByDate(
  papers: ArxivPaper[],
): Record<string, ArxivPaper[]> {
  const grouped: Record<string, ArxivPaper[]> = {};
  for (const paper of papers) {
    const date = new Date(paper.published);
    const label = isToday(date)
      ? "Today"
      : isYesterday(date)
        ? "Yesterday"
        : isThisWeek(date, { weekStartsOn: 1 })
          ? "This Week"
          : format(date, "MMMM yyyy");
    (grouped[label] ||= []).push(paper);
  }
  return grouped;
}
