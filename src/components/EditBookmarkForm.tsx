import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { Bookmark } from "../types";
import type { Library } from "../hooks/useLibrary";
import { editBookmark, parseTags } from "../utils/bookmarks";

export function EditBookmarkForm({
  bookmark,
  library,
}: {
  bookmark: Bookmark;
  library: Library;
}) {
  const { pop } = useNavigation();
  const { handleSubmit, itemProps } = useForm<{
    tags: string;
    notes: string;
    rating: string;
  }>({
    initialValues: {
      tags: bookmark.tags.join(", "),
      notes: bookmark.notes || "",
      rating: String(bookmark.rating || 0),
    },
    async onSubmit(values) {
      const saved = await library.update(
        () =>
          editBookmark(bookmark.paperId, {
            tags: parseTags(values.tags),
            notes: values.notes.trim() || undefined,
            rating: Number(values.rating) || undefined,
          }),
        "Bookmark updated",
      );
      if (saved) pop();
    },
  });
  return (
    <Form
      navigationTitle="Edit Bookmark"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Bookmark" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Paper" text={bookmark.paper.title} />
      <Form.TextField
        title="Tags"
        placeholder="methods, to-review"
        info="Separate tags with commas."
        {...itemProps.tags}
      />
      <Form.Dropdown title="Rating" {...itemProps.rating}>
        <Form.Dropdown.Item value="0" title="Not Rated" />
        {[1, 2, 3, 4, 5].map((rating) => (
          <Form.Dropdown.Item
            key={rating}
            value={String(rating)}
            title={`${rating} / 5`}
          />
        ))}
      </Form.Dropdown>
      <Form.TextArea
        title="Notes"
        placeholder="Your notes about this paper"
        {...itemProps.notes}
      />
    </Form>
  );
}
