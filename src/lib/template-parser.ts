import fs from "node:fs/promises";
import path from "node:path";

export const TemplateParser = {
  /**
   * Reads an HTML template from the /templates directory and replaces variables.
   *
   * @param templateName The name of the template file (e.g., "password-reset.html")
   * @param variables An object containing variables to replace in the template (e.g., { resetLink: "https..." })
   * @returns The parsed HTML string with variables injected
   */
  async parse(
    templateName: string,
    variables: Record<string, string>,
  ): Promise<{ html: string; text: string }> {
    const templatePath = path.join(process.cwd(), "templates", templateName);

    try {
      let template = await fs.readFile(templatePath, "utf-8");

      // Replace all occurrences of {{variable}} with their corresponding value
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, value);
      }

      const html = template;

      // Basic HTML to Text conversion
      const text = template
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<[^>]+>/g, "") // Remove all remaining tags
        .replace(/&copy;/g, "©")
        .replace(/^\s+|\s+$/gm, "") // Trim lines
        .replace(/\n\s+\n/g, "\n\n") // Collapse multiple empty lines
        .trim();

      return { html, text };
    } catch (error) {
      console.error(
        `Failed to load or parse email template: ${templateName}`,
        error,
      );
      throw error;
    }
  },
};
