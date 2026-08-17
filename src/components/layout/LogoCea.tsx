import { useEffect, useState } from 'react'
import { coresDaMarca, CORES_FALLBACK } from '@/lib/cea'

/**
 * Logo C&A: "C" e "A" no azul institucional, "&" em vermelho, dentro do oval.
 * Tenta as cores extraídas do site oficial (/api/cea/logo) e cai nos tokens.
 * C&A Brasil mantém o wordmark azul-marinho (a matriz europeia virou vermelha em 2020).
 */
export function LogoCea({ altura = 28 }: { altura?: number }) {
  const [cores, setCores] = useState<{ blue: string; red: string }>(CORES_FALLBACK)

  useEffect(() => {
    let ativo = true
    coresDaMarca().then((c) => {
      if (ativo) setCores({ blue: c.blue, red: c.red })
    })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <svg
      role="img"
      aria-label="C&A"
      viewBox="0 0 96 44"
      height={altura}
      style={{ display: 'block' }}
    >
      <ellipse cx="48" cy="22" rx="45" ry="20" fill="#FFFFFF" stroke={cores.blue} strokeWidth="2.5" />
      <text
        x="48"
        y="30"
        textAnchor="middle"
        fontFamily="Poppins, Arial, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill={cores.blue}
      >
        C
        <tspan fill={cores.red}>&amp;</tspan>
        A
      </text>
    </svg>
  )
}
