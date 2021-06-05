import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	BaseEntity,
	ManyToOne,
	JoinColumn,
	OneToMany,
} from "typeorm"
import { User } from "../users/users.model"
import { Permission } from "./permissions.model"
@Entity()
export class Video extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number

	@Column(`int`)
	user_id: number

	@Column(`varchar`)
	name: string

	@Column(`varchar`)
	type: string
	
	@Column(`varchar`)
	link: string

	@ManyToOne(()=>User, user => user.videos)
	@JoinColumn({ name: `user_id` })
	user: User

	@OneToMany(() => Permission, permission => permission.video)
	permissions: Permission[]
}