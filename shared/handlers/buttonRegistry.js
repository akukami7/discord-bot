/**
 * Button handler registry
 * Allows commands to register button/select menu handlers centrally
 */
class ButtonRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a handler for a button prefix
   * @param {string} prefix - CustomId prefix (e.g., 'duel_', 'shop_')
   * @param {Object} handlers - Handler functions
   * @param {Function} handlers.handleButton - Button handler
   * @param {Function} [handlers.handleSelect] - Select menu handler
   */
  register(prefix, handlers) {
    this.handlers.set(prefix, handlers);
  }

  /**
   * Get handler for a customId
   * @param {string} customId - The interaction customId
   * @returns {{ prefix: string, handler: Function } | null}
   */
  getHandler(customId) {
    for (const [prefix, handlers] of this.handlers.entries()) {
      if (customId.startsWith(prefix)) {
        const handler = customId.startsWith(prefix) && handlers.handleButton
          ? handlers.handleButton
          : null;
        return handler ? { prefix, handler } : null;
      }
    }
    return null;
  }

  /**
   * Get select menu handler for a customId
   */
  getSelectHandler(customId) {
    for (const [prefix, handlers] of this.handlers.entries()) {
      if (customId.startsWith(prefix) && handlers.handleSelect) {
        return { prefix, handler: handlers.handleSelect };
      }
    }
    return null;
  }
}

export const buttonRegistry = new ButtonRegistry();
