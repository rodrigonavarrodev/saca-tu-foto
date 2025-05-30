interface Env {
  ANTHROPIC_API_KEY: string;
  TAPILA_API_KEY: string;
  TAPILA_LOGIN_API_KEY: string;
  TAPILA_CLIENT_USERNAME: string;
  TAPILA_CLIENT_PASSWORD: string;
}

export function loadEnv(): Env {
  const env = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    TAPILA_API_KEY: process.env.TAPILA_API_KEY || '',
    TAPILA_LOGIN_API_KEY: process.env.TAPILA_LOGIN_API_KEY || '',
    TAPILA_CLIENT_USERNAME: process.env.TAPILA_CLIENT_USERNAME || '',
    TAPILA_CLIENT_PASSWORD: process.env.TAPILA_CLIENT_PASSWORD || '',
  };

  // Verificar que todas las variables de entorno necesarias estén presentes
  const missingVars = Object.entries(env)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
  }

  return env;
} 