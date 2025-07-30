import en from '../messages/en.json';
import ko from '../messages/ko.json';

const messages = { en, ko };

export function getMessages(locale: string) {
  return messages[locale as keyof typeof messages] || messages.en;
}

export function useTranslations(locale: string, namespace?: string) {
  const msgs = getMessages(locale);
  
  return function t(key: string, variables?: Record<string, any>) {
    const keys = namespace ? `${namespace}.${key}`.split('.') : key.split('.');
    let result: any = msgs;
    
    for (const k of keys) {
      result = result?.[k];
    }
    
    let message = result || key;
    
    // Replace variables in the message
    if (variables && typeof message === 'string') {
      Object.keys(variables).forEach(varKey => {
        message = message.replace(new RegExp(`\\{${varKey}\\}`, 'g'), variables[varKey]);
      });
    }
    
    return message;
  };
}