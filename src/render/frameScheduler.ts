/**
 * Regroupe les tâches coûteuses au prochain rafraîchissement d'écran.
 * Pour une même clé, seule la dernière demande s'exécute : un curseur ou une pipette qui envoie
 * des dizaines d'événements par seconde ne déclenche qu'un calcul par image affichée.
 */
export class FrameScheduler {
  private readonly tasks = new Map<string, () => void>()
  private frameRequest = 0

  constructor(private readonly afterTasks: () => void = () => undefined) {}

  schedule(key: string, task: () => void): void {
    this.tasks.delete(key)
    this.tasks.set(key, task)
    this.requestFrame()
  }

  requestFrame(): void {
    if (this.frameRequest) return
    this.frameRequest = requestAnimationFrame(() => this.flush())
  }

  /** Exécute tout de suite les tâches en attente, dans l'ordre où elles ont été demandées. */
  flush(): void {
    cancelAnimationFrame(this.frameRequest)
    this.frameRequest = 0
    const pending = [...this.tasks.values()]
    this.tasks.clear()
    for (const task of pending) task()
    this.afterTasks()
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest)
    this.frameRequest = 0
    this.tasks.clear()
  }
}
