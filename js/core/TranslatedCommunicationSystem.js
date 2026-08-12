// WorldProject - Mehrsprachige Kommunikation fuer Markt, Vertraege und spaeter Chat.
// Originaltexte bleiben erhalten. Die UI kann pro Empfaenger eine Uebersetzung laden.
export class TranslatedCommunicationSystem {
  constructor({ translator = null, i18n = null } = {}) {
    this.translator = translator;
    this.i18n = i18n;
    this.cache = new Map();
  }

  createMessage({ authorId, text, sourceLanguage = 'auto', type = 'market', metadata = {} } = {}) {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('Text fehlt');
    return {
      id: crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      authorId,
      type,
      originalText: clean,
      sourceLanguage,
      metadata,
      createdAt: Date.now()
    };
  }

  async display(message, targetLanguage) {
    if (!message) return null;
    const target = targetLanguage || this.i18n?.language || 'de';
    if (!this.translator || target === message.sourceLanguage) {
      return { text: message.originalText, originalText: message.originalText, translated: false, language: target };
    }
    const key = `${message.id}:${target}`;
    if (this.cache.has(key)) return this.cache.get(key);
    try {
      const translatedText = await this.translator.translate({
        text: message.originalText,
        sourceLanguage: message.sourceLanguage,
        targetLanguage: target
      });
      const result = { text: translatedText, originalText: message.originalText, translated: true, language: target };
      this.cache.set(key, result);
      return result;
    } catch {
      return { text: message.originalText, originalText: message.originalText, translated: false, language: message.sourceLanguage, translationFailed: true };
    }
  }

  // Einheitliches Format: funktioniert fuer Marktangebote, Kaufgesuche,
  // Liefervertraege, Direktnachrichten, Gildenchat und spaeter Globalchat.
  createMarketOffer(data) { return this.createMessage({ ...data, type: 'market_offer' }); }
  createPurchaseRequest(data) { return this.createMessage({ ...data, type: 'purchase_request' }); }
  createContractMessage(data) { return this.createMessage({ ...data, type: 'contract' }); }
  createDirectMessage(data) { return this.createMessage({ ...data, type: 'direct_message' }); }
  createGuildMessage(data) { return this.createMessage({ ...data, type: 'guild_chat' }); }
  createGlobalMessage(data) { return this.createMessage({ ...data, type: 'global_chat' }); }
}
