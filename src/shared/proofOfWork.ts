export async function computeProofOfWork(
  challenge: string,
  difficulty: number,
  onProgress?: (attempt: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    let attempt = 0;
    const targetPrefix = '0'.repeat(difficulty);

    const compute = async () => {
      const batchSize = 1000;

      for (let i = 0; i < batchSize; i++) {
        const solution = attempt.toString();
        const hash = await sha256(challenge + solution);

        if (hash.startsWith(targetPrefix)) {
          resolve(solution);
          return;
        }

        attempt++;
      }

      if (onProgress) {
        onProgress(attempt);
      }

      setTimeout(compute, 0);
    };

    compute();
  });
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
