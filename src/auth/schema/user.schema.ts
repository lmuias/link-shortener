import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@Schema()
@ApiExtraModels(User)
export class User extends Document {
  @Prop({ required: true, unique: true })
  @ApiProperty({ example: 'user@example.com', description: 'Your email' })
  email!: string;

  @Prop({ required: true })
  @ApiProperty({ example: 'securePassword123', description: 'Password' })
  password!: string;

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
