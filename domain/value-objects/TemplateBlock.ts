/**
 * TemplateBlock Value Object
 *
 * Represents a single MJML block/component in an email template.
 * Immutable value object following clean code practices.
 */

export type BlockType =
  | 'mj-text'
  | 'mj-image'
  | 'mj-button'
  | 'mj-divider'
  | 'mj-spacer'
  | 'mj-social'
  | 'mj-section'
  | 'mj-column'
  | 'mj-group'
  | 'mj-hero'
  | 'mj-navbar'
  | 'mj-accordion';

export interface BlockAttributes {
  [key: string]: any;
}

export interface TemplateBlockProps {
  tagName: BlockType;
  attributes?: BlockAttributes;
  content?: string;
  children?: TemplateBlockProps[];
}

/**
 * TemplateBlock Value Object
 * Immutable representation of an MJML component
 */
export class TemplateBlock {
  constructor(
    public readonly tagName: BlockType,
    public readonly attributes: BlockAttributes = {},
    public readonly content?: string,
    public readonly children?: TemplateBlock[]
  ) {
    this.validate();
  }

  /**
   * Validate block structure
   * @throws Error if validation fails
   */
  private validate(): void {
    const validTypes: BlockType[] = [
      'mj-text',
      'mj-image',
      'mj-button',
      'mj-divider',
      'mj-spacer',
      'mj-social',
      'mj-section',
      'mj-column',
      'mj-group',
      'mj-hero',
      'mj-navbar',
      'mj-accordion'
    ];

    if (!validTypes.includes(this.tagName)) {
      throw new Error(`Invalid block type: ${this.tagName}`);
    }

    // Validate that attributes is an object
    if (this.attributes && typeof this.attributes !== 'object') {
      throw new Error('Block attributes must be an object');
    }

    // Container blocks should have children, not content
    const containerBlocks: BlockType[] = ['mj-section', 'mj-column', 'mj-group', 'mj-hero'];
    if (containerBlocks.includes(this.tagName) && this.content) {
      throw new Error(`${this.tagName} should not have direct content, use children instead`);
    }
  }

  /**
   * Check if block is a container (has children)
   */
  isContainer(): boolean {
    return !!this.children && this.children.length > 0;
  }

  /**
   * Check if block has content
   */
  hasContent(): boolean {
    return !!this.content && this.content.trim().length > 0;
  }

  /**
   * Get attribute value
   */
  getAttribute(key: string): any {
    return this.attributes[key];
  }

  /**
   * Create a new block with updated attributes
   * Immutability pattern
   */
  withAttributes(newAttributes: BlockAttributes): TemplateBlock {
    return new TemplateBlock(
      this.tagName,
      { ...this.attributes, ...newAttributes },
      this.content,
      this.children
    );
  }

  /**
   * Create a new block with updated content
   */
  withContent(newContent: string): TemplateBlock {
    return new TemplateBlock(
      this.tagName,
      this.attributes,
      newContent,
      this.children
    );
  }

  /**
   * Convert to MJML JSON structure
   */
  toJSON(): TemplateBlockProps {
    const json: TemplateBlockProps = {
      tagName: this.tagName
    };

    if (Object.keys(this.attributes).length > 0) {
      json.attributes = this.attributes;
    }

    if (this.content) {
      json.content = this.content;
    }

    if (this.children && this.children.length > 0) {
      json.children = this.children.map(child => child.toJSON());
    }

    return json;
  }

  /**
   * Create from MJML JSON structure
   */
  static fromJSON(json: TemplateBlockProps): TemplateBlock {
    const children = json.children
      ? json.children.map(child => TemplateBlock.fromJSON(child))
      : undefined;

    return new TemplateBlock(
      json.tagName,
      json.attributes || {},
      json.content,
      children
    );
  }

  /**
   * Create a text block
   * Factory method for common block types
   */
  static createText(content: string, attributes?: BlockAttributes): TemplateBlock {
    return new TemplateBlock('mj-text', attributes, content);
  }

  /**
   * Create an image block
   */
  static createImage(src: string, alt?: string, attributes?: BlockAttributes): TemplateBlock {
    return new TemplateBlock('mj-image', { src, alt, ...attributes });
  }

  /**
   * Create a button block
   */
  static createButton(content: string, href: string, attributes?: BlockAttributes): TemplateBlock {
    return new TemplateBlock('mj-button', { href, ...attributes }, content);
  }

  /**
   * Create a spacer block
   */
  static createSpacer(height: string = '20px'): TemplateBlock {
    return new TemplateBlock('mj-spacer', { height });
  }
}
