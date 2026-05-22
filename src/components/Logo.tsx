'use client';

import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol';
  className?: string;
  alt?: string;
  priority?: boolean;
}

export default function Logo({
  variant = 'full',
  className = 'h-8 w-auto',
  alt = 'BareFolio',
  priority = false,
}: LogoProps) {
  // URLs de los assets SVG copiados de la carpeta Recursos a public/
  const isologoBlack = '/ISOLOGO BLACK.svg';
  const isologoWhite = '/ISOLOGO WHITE.svg';
  const logotipoBlack = '/Logotipo Black.svg';
  const logotipoWhite = '/Logotipo White.svg';

  if (variant === 'symbol') {
    return (
      <div className={`relative inline-block ${className}`}>
        {/* Isologo para modo claro (se oculta en modo oscuro) */}
        <img
          src={isologoBlack}
          alt={`${alt} Symbol`}
          className="dark:hidden block w-full h-full object-contain"
          loading={priority ? 'eager' : 'lazy'}
        />
        {/* Isologo para modo oscuro (se oculta en modo claro) */}
        <img
          src={isologoWhite}
          alt={`${alt} Symbol`}
          className="hidden dark:block w-full h-full object-contain"
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Logotipo completo para modo claro (se oculta en modo oscuro) */}
      <img
        src={logotipoBlack}
        alt={alt}
        className="dark:hidden block w-full h-full object-contain"
        loading={priority ? 'eager' : 'lazy'}
      />
      {/* Logotipo completo para modo oscuro (se oculta en modo claro) */}
      <img
        src={logotipoWhite}
        alt={alt}
        className="hidden dark:block w-full h-full object-contain"
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
