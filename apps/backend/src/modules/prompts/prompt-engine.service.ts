import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PromptEngineService {
  /**
   * Compiles a template by substituting placeholders like {{variable_name}}
   * with values from the variables mapping.
   *
   * @param template Raw prompt template string
   * @param requiredVariables List of variables that MUST be supplied
   * @param values Key-value mapping of placeholder values
   * @returns Compiled prompt string
   */
  compile(
    template: string,
    requiredVariables: string[],
    values: Record<string, string>,
  ): string {
    // 1. Verify all required variables are present
    const missing: string[] = [];
    for (const v of requiredVariables) {
      if (values[v] === undefined || values[v] === null) {
        missing.push(v);
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required prompt variables: ${missing.join(', ')}`,
      );
    }

    // 2. Perform replacements using a regex matching {{var_name}}
    let compiled = template;
    const placeholderRegex = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;

    compiled = compiled.replace(placeholderRegex, (match, key) => {
      const value = values[key];
      if (value !== undefined && value !== null) {
        return value;
      }
      return match; // If variable is in template but not in required variables list, keep it
    });

    return compiled;
  }
}
