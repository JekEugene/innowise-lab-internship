import { Router, Request, Response } from 'express'
import { ICreateUserDto } from '../user/dto/create-user.dto'
import { IUserPayload } from './user-payload.interface'
const authController = Router()
import { authenticationService } from './authentication.service'
import { authUser } from '../../middleware/auth'
import { logger } from '../../config/logger'
import { AppError } from '../../error/AppError'

/**
 * @swagger
 * /auth/register:
 *   post:
 *     consumes:
 *     - application/json
 *     summary: create account
 *     tags:
 *     - auth
 *     parameters:
 *     - in: body
 *       name: registration
 *       schema:
 *         type: object
 *         required:
 *         - login
 *         - password
 *         properties:
 *           login:
 *             type: string
 *           password:
 *             type: string
 *     responses:
 *       200:
 *         description: Success
 *       422:
 *         description: User already exists
 */
authController.post(`/register`, async (req: Request, res: Response) => {
	try {
		const { login, password } = req.body
		const user = await authenticationService.getUserByLogin(login)
		if (user) {
			return res.status(422).send(`user already exists`)
		}
		const hashPassword = await authenticationService.hashPassword(password)
		const newUser: ICreateUserDto = {
			login,
			password: hashPassword,
		}
		authenticationService.createUser(newUser)
		return res.redirect(201, `/login`)
	} catch (err) {
		logger.error(``, err)
	}
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     consumes:
 *     - application/json
 *     summary: login to account
 *     tags:
 *     - auth
 *     parameters:
 *     - in: body
 *       name: registration
 *       schema:
 *         type: object
 *         required:
 *         - login
 *         - password
 *         properties:
 *           login:
 *             type: string
 *           password:
 *             type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Login or password incorrect
 */
authController.post(`/login`, async (req: Request, res: Response) => {
	try {
		const { login, password } = req.body
		const user = await authenticationService.getUserByLogin(login)
		if (!user) {
			return res.status(400).send(`Login or password incorrect`)
		}
		const arePasswordsSame: boolean =
			await authenticationService.comparePasswords(user, password)
		if (!arePasswordsSame) {
			return res.status(400).send(`Login or password incorrect`)
		}

		const userPayload: IUserPayload = {
			id: user.id,
			login: user.login,
		}

		const refreshToken = authenticationService.signRefreshToken(userPayload)
		authenticationService.createToken(user.id, refreshToken)
		const accessToken = authenticationService.signAccessToken(userPayload)

		res.cookie(`accessToken`, accessToken, {
			maxAge: 1000 * 15,
			httpOnly: true,
			path: `/`,
		})
		res.cookie(`refreshToken`, refreshToken, {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			httpOnly: true,
			path: `/`,
		})
		res.cookie(`login`, user.login, { maxAge: 1000 * 60 * 60 * 24 * 7 })
		res.cookie(`id`, user.id, { maxAge: 1000 * 60 * 60 * 24 * 7 })
		return res.redirect(200, `/`)
	} catch (err) {
		logger.error(``, err)
		if (err instanceof AppError) {
			return res.status(err.statusCode).send(err.message)
		}
		return res.status(400).send(`unknow error`)
	}
})

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: logout from accout
 *     tags:
 *     - auth
 *     parameters:
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: You are not logged in
 */
authController.get(
	`/logout`,
	authUser,
	async (req: Request, res: Response) => {
		try {
			if (!res.locals.auth) {
				return res.status(401).send(`you are not logged in`)
			}
			authenticationService.deleteToken(
				res.locals.refreshToken,
				res.locals.user.id
			)
			res
				.clearCookie(`accessToken`)
				.clearCookie(`refreshToken`)
				.clearCookie(`id`)
				.clearCookie(`login`)
			return res.redirect(200, `/`)
		} catch (err) {
			logger.error(``, err)
		}
	}
)

export = authController
