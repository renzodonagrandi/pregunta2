import type { QuestionDef } from '@/features/match/engine'
import type { PlayableGame } from './types'

// Hardcoded game for stage 2 (no database yet). Replaced by DB queries later.

type Q = [
  text: string,
  options: [string, string, string, string],
  correct: number,
]

function questions(categoryId: string, list: Q[]): QuestionDef[] {
  return list.map(([text, options, correctIndex], i) => ({
    id: `${categoryId}-${i}`,
    categoryId,
    text,
    options,
    correctIndex,
  }))
}

export const SAMPLE_GAME: PlayableGame = {
  id: 'sample',
  slug: 'demo',
  title: 'Trivia de prueba',
  categories: [
    { id: 'geo', name: 'Geografía', color: '#1565C0', imageUrl: null },
    { id: 'sci', name: 'Ciencia', color: '#2E7D32', imageUrl: null },
    { id: 'sport', name: 'Deportes', color: '#BF360C', imageUrl: null },
    { id: 'art', name: 'Arte', color: '#6A1B9A', imageUrl: null },
  ],
  questions: [
    ...questions('geo', [
      [
        '¿Cuál es la capital de Australia?',
        ['Sídney', 'Canberra', 'Melbourne', 'Perth'],
        1,
      ],
      [
        '¿Cuál es el río más caudaloso del mundo?',
        ['Nilo', 'Misisipi', 'Amazonas', 'Yangtsé'],
        2,
      ],
      [
        '¿En qué país está Machu Picchu?',
        ['Perú', 'Bolivia', 'Ecuador', 'Chile'],
        0,
      ],
      [
        '¿Cuál es el país más grande de Sudamérica?',
        ['Argentina', 'Colombia', 'Perú', 'Brasil'],
        3,
      ],
      [
        '¿Qué océano baña las costas de Portugal?',
        ['Índico', 'Atlántico', 'Pacífico', 'Ártico'],
        1,
      ],
      [
        '¿Cuál es la montaña más alta de América?',
        ['Chimborazo', 'Denali', 'Aconcagua', 'Huascarán'],
        2,
      ],
    ]),
    ...questions('sci', [
      ['¿Cuál es el símbolo químico del oro?', ['Au', 'Ag', 'Or', 'Go'], 0],
      ['¿Cuántos planetas tiene el sistema solar?', ['7', '8', '9', '10'], 1],
      [
        '¿Qué gas absorben las plantas en la fotosíntesis?',
        ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Helio'],
        2,
      ],
      [
        '¿Cuál es el hueso más largo del cuerpo humano?',
        ['Húmero', 'Tibia', 'Columna', 'Fémur'],
        3,
      ],
      [
        '¿A qué temperatura hierve el agua al nivel del mar?',
        ['90 °C', '100 °C', '110 °C', '120 °C'],
        1,
      ],
      [
        '¿Quién propuso la teoría de la relatividad?',
        ['Newton', 'Einstein', 'Galileo', 'Tesla'],
        1,
      ],
    ]),
    ...questions('sport', [
      [
        '¿Cuántos jugadores tiene un equipo de fútbol en cancha?',
        ['9', '10', '11', '12'],
        2,
      ],
      [
        '¿En qué país se jugó el primer Mundial de fútbol?',
        ['Uruguay', 'Italia', 'Brasil', 'Francia'],
        0,
      ],
      [
        '¿Cada cuántos años se hacen los Juegos Olímpicos de verano?',
        ['2', '3', '4', '5'],
        2,
      ],
      [
        '¿En qué deporte se usa un “shuttlecock”?',
        ['Tenis', 'Bádminton', 'Squash', 'Pádel'],
        1,
      ],
      ['¿Cuántos puntos vale un triple en básquet?', ['1', '2', '3', '4'], 2],
      [
        '¿Qué país ganó el Mundial de fútbol 2022?',
        ['Francia', 'Brasil', 'Croacia', 'Argentina'],
        3,
      ],
    ]),
    ...questions('art', [
      [
        '¿Quién pintó la Mona Lisa?',
        ['Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Botticelli'],
        1,
      ],
      [
        '¿Quién pintó “La noche estrellada”?',
        ['Van Gogh', 'Monet', 'Picasso', 'Dalí'],
        0,
      ],
      [
        '¿De qué país era Frida Kahlo?',
        ['España', 'Argentina', 'México', 'Colombia'],
        2,
      ],
      [
        '¿Quién escribió “Don Quijote de la Mancha”?',
        ['Lope de Vega', 'Quevedo', 'Góngora', 'Cervantes'],
        3,
      ],
      [
        '¿Qué artista es famoso por “Guernica”?',
        ['Picasso', 'Miró', 'Goya', 'Velázquez'],
        0,
      ],
      ['¿Cuántas cuerdas tiene una guitarra clásica?', ['4', '5', '6', '7'], 2],
    ]),
  ],
}
