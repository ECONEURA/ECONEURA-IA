import { z } from "zod";

// Esquemas de validación avanzados
export const AIRequestSchema = z.object({
  prompt: z.string().min(1, "El prompt no puede estar vacío").max(4000, "El prompt es demasiado largo"),
  system: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "model"]),
    text: z.string().min(1)
  })).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional()
});

export const ImageRequestSchema = z.object({
  prompt: z.string().min(1, "El prompt no puede estar vacío").max(1000, "El prompt es demasiado largo"),
  size: z.enum(["256x256", "512x512", "1024x1024"]).optional(),
  quality: z.enum(["standard", "hd"]).optional()
});

export const TTSRequestSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío").max(5000, "El texto es demasiado largo"),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional()
});

export const SearchRequestSchema = z.object({
  query: z.string().min(2, "La búsqueda debe tener al menos 2 caracteres").max(200, "La búsqueda es demasiado larga"),
  limit: z.number().min(1).max(20).optional()
});

export const TemplateRequestSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string()).optional()
});

// Validación con mensajes personalizados en español
export const validateAIRequest = (data: any) => {
  try {
    return { success: true, data: AIRequestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
};

export const validateImageRequest = (data: any) => {
  try {
    return { success: true, data: ImageRequestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
};

export const validateTTSRequest = (data: any) => {
  try {
    return { success: true, data: TTSRequestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
};

export const validateSearchRequest = (data: any) => {
  try {
    return { success: true, data: SearchRequestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
};

export const validateTemplateRequest = (data: any) => {
  try {
    return { success: true, data: TemplateRequestSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
};
