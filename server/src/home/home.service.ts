import { Request, Response} from 'express'

export const homeService = {
	async userPage (req: Request, res: Response) :Promise<void> {
		console.log(`hi`)
	}
}