import { Request, Response} from 'express'

export const userService = {
	async userPage (req: Request, res: Response) :Promise<void> {
		console.log(`hi`)
	}
}



