export async function sleep(seconds: number): Promise<void> {
  return await new Promise((resolve,_) => {
    setTimeout(resolve, seconds * 1000);
  });
}
