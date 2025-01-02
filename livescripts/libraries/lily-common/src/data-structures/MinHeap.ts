export class MinHeap {
  private heap: number[];

  constructor() {
    this.heap = [];
  }

  // Adds a value to the heap
  push(value: number): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  // Removes and returns the smallest value
  pop(): number {
    if (this.isEmpty()) {
      throw new Error("Heap is empty.");
    }
    const min = this.heap[0];
    const end = this.heap.pop()!;
    if (!this.isEmpty()) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }
    return min;
  }

  // Returns the smallest value without removing it
  peek(): number {
    if (this.isEmpty()) {
      throw new Error("Heap is empty.");
    }
    return this.heap[0];
  }

  // Checks if the heap is empty
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  // Bubbles up a value to maintain the heap property
  private bubbleUp(index: number): void {
    const value = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (value >= parent) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = value;
  }

  // Bubbles down a value to maintain the heap property
  private bubbleDown(index: number): void {
    const length = this.heap.length;
    const value = this.heap[index];

    while (true) {
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;
      let smallest = index;

      if (leftIndex < length && this.heap[leftIndex] < this.heap[smallest]) {
        smallest = leftIndex;
      }
      if (rightIndex < length && this.heap[rightIndex] < this.heap[smallest]) {
        smallest = rightIndex;
      }
      if (smallest === index) break;

      this.heap[index] = this.heap[smallest];
      index = smallest;
    }
    this.heap[index] = value;
  }
}
