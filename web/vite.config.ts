import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

const base64Plugin = () => {
  return {
    name: 'base64',
    transform: (src: string, id: string) => {
      const [path, query] = id.split('?');
      if (query != 'base64') return null;
      const data = readFileSync(path).toString('base64');

      return `export default '${data}';`;
    },
  };
};

export default defineConfig({
  plugins: [sveltekit(), base64Plugin()],
});
