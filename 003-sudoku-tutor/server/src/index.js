import express from 'express'
import cors from 'cors'
import sudokuRoutes from './routes/sudokuRoutes.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/sudoku', sudokuRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`数独导师服务运行在 http://localhost:${PORT}`)
})

export default app
