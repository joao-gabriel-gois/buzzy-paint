import bcrypt from 'npm:bcrypt';

export const hash = async (password: string) => {
  let hashedPassword;
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  } catch (error) {
    // @ts-ignore: because catch is a bitch and I'm just starting the f****** project, for cry sake
    throw new Error(error);
  }
  if (!hashedPassword) {
    throw new Error('It was not possible to really hash users\'s password');
  }
  return hashedPassword;
}

export const checkHash = async (plainPassword: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch(e) {
    throw new Error('Not able to check the hash, error:', e as Error);
  }
};