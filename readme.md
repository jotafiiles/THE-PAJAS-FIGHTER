# Pixel Fighter - Juego de Peleas Estilo MUGEN

¡Un juego de peleas 2D estilo MUGEN hecho con HTML5 Canvas y JavaScript!

## 🎮 Características

- **Sistema de sprites personalizado**: Carga personajes desde carpetas con archivos PNG
- **Combate para 2 jugadores**: Controles separados para cada jugador
- **Sistema de combate completo**: Golpes ligeros, pesados, patadas, saltos y agacharse
- **Barras de vida**: Con efecto de daño retardado visual
- **Temporizador**: Partidas de 60 segundos
- **Gráficos pixel art**: Estilo retro con placeholders si no hay sprites

## 🚀 Cómo Jugar

### Controles Jugador 1:
- **A/D**: Mover izquierda/derecha
- **W**: Saltar
- **S**: Agacharse
- **F**: Golpe ligero
- **G**: Golpe fuerte/Patada

### Controles Jugador 2:
- **←/→**: Mover izquierda/derecha
- **↑**: Saltar
- **↓**: Agacharse
- **K**: Golpe ligero
- **L**: Golpe fuerte/Patada

## 📁 Estructura de Carpetas para Personajes

Para agregar tus propios personajes, crea la siguiente estructura:

```
characters/
├── player1/
│   ├── idle.png          (posición neutral)
│   ├── walk.png          (caminando)
│   ├── run.png           (corriendo)
│   ├── jump.png          (saltando)
│   ├── crouch.png        (agachado)
│   ├── punch_light.png   (golpe ligero)
│   ├── punch_heavy.png   (golpe fuerte)
│   ├── kick_light.png    (patada ligera)
│   ├── kick_heavy.png    (patada fuerte)
│   ├── hit.png           (recibiendo golpe)
│   ├── knockdown.png     (derrotado)
│   └── victory.png       (victoria)
└── player2/
    └── [mismos archivos]
```

### Notas sobre los Sprites:
- Todos los archivos deben ser **PNG**
- El juego funciona incluso sin sprites (usa rectángulos pixelados como placeholder)
- Los sprites se escalan automáticamente a 50x150 píxeles
- Para mejor resultado, usa sprites con fondo transparente

## 🛠️ Instalación y Uso

1. **Abrir el juego**: Simplemente abre `index.html` en tu navegador
2. **Sin dependencias**: No requiere instalación ni servidor
3. **Opcional - Servidor local**: Para cargar sprites personalizados, usa un servidor local:
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # Con Node.js
   npx http-server
   ```
4. Accede a `http://localhost:8000`

## 🎨 Creando Sprites Personalizados

### Especificaciones Técnicas:
- **Formato**: PNG con transparencia (recomendado)
- **Tamaño sugerido**: 50x150 píxeles (o proporcional)
- **Estilo**: Pixel art para mantener la estética retro

### Consejos de Diseño:
1. Mantén la misma altura para todos los sprites del personaje
2. El punto de apoyo (pies) debe estar en la misma posición vertical
3. Para ataques, extiende el sprite hacia la dirección del ataque
4. Usa colores vibrantes para mejor visibilidad

## 🔧 Personalización Avanzada

Puedes modificar en `game.js`:

```javascript
// Cambiar gravedad
this.gravity = 0.7;

// Modificar daño de ataques
const damage = this.player1.currentAction === 'punch_heavy' ? 15 : 10;

// Ajustar velocidad de movimiento
player.velocity.x = -5; // izquierda
player.velocity.x = 5;  // derecha

// Cambiar tiempo del temporizador
this.timer = 60; // segundos
```

## 📝 Estado del Juego

El juego incluye:
- ✅ Sistema de carga de sprites desde carpetas
- ✅ Detección de colisiones
- ✅ Sistema de combate (golpes, patadas)
- ✅ Barras de vida con animación
- ✅ Temporizador de partida
- ✅ Sistema de victoria/derrota
- ✅ Controles para 2 jugadores
- ✅ Gráficos placeholder (sin sprites)
- ✅ Movimiento completo (caminar, saltar, agacharse)

## 🎯 Próximas Mejoras (Ideas)

- [ ] Agregar más tipos de ataques especiales
- [ ] Sistema de combos
- [ ] Barra de energía para especiales
- [ ] Sonidos y música
- [ ] Más escenarios
- [ ] Modo historia
- [ ] IA para jugar solo
- [ ] Efectos de partículas

## 📄 Licencia

Libre uso. ¡Modifica y comparte!

---

**¡Disfruta creando tus propios personajes y batallas!** 🥊
