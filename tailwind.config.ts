import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-in": {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.05)",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "slide-up": {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "rainbow": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "slide-up": "slide-up 0.4s ease-out",
        "rainbow": "rainbow 3s ease infinite",
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        opensans: ['Open Sans', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
        merriweather: ['Merriweather', 'serif'],
        lora: ['Lora', 'serif'],
        bebas: ['Bebas Neue', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        ubuntu: ['Ubuntu', 'sans-serif'],
        ptsans: ['PT Sans', 'sans-serif'],
        crimson: ['Crimson Text', 'serif'],
        archivo: ['Archivo', 'sans-serif'],
        cabin: ['Cabin', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
        barlow: ['Barlow', 'sans-serif'],
        righteous: ['Righteous', 'cursive'],
        bungee: ['Bungee', 'cursive'],
        permanent: ['Permanent Marker', 'cursive'],
        bangers: ['Bangers', 'cursive'],
        blackops: ['Black Ops One', 'cursive'],
        fredoka: ['Fredoka One', 'cursive'],
        audiowide: ['Audiowide', 'cursive'],
        pacifico: ['Pacifico', 'cursive'],
        dancing: ['Dancing Script', 'cursive'],
        greatvibes: ['Great Vibes', 'cursive'],
        sacramento: ['Sacramento', 'cursive'],
        satisfy: ['Satisfy', 'cursive'],
        caveat: ['Caveat', 'cursive'],
        kaushan: ['Kaushan Script', 'cursive'],
        lobster: ['Lobster', 'cursive'],
        cookie: ['Cookie', 'cursive'],
        courgette: ['Courgette', 'cursive'],
        amatic: ['Amatic SC', 'cursive'],
        indie: ['Indie Flower', 'cursive'],
        shadows: ['Shadows Into Light', 'cursive'],
        patrick: ['Patrick Hand', 'cursive'],
        reenie: ['Reenie Beanie', 'cursive'],
        rock: ['Rock Salt', 'cursive'],
        covered: ['Covered By Your Grace', 'cursive'],
        homemade: ['Homemade Apple', 'cursive'],
        architects: ['Architects Daughter', 'cursive'],
        waiting: ['Waiting for the Sunrise', 'cursive'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
