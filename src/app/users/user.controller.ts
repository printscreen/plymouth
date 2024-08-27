import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from '@app/app/users/user.service';
import { UserDto } from '@app/app/users/dto/user.dto';
import { CreateUserDto } from '@app/app/users/dto/create-user.dto';
import { CreateUserExternalDto } from '@app/app/users/dto/create-user-external.dto';
import { CreateProviderUserDto } from '@app/app/oauth/dto/create-provider-user.dto';
import { OauthService } from '@app/app/oauth/oauth.service';
import { ProviderUser } from '@app/app/oauth/providers/provider.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RequestWithUser } from '../../auth/types/index';
import { UserEntity } from './entities/user.entity';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(createUserDto);
  }

  @Post('/external')
  async createExternal(
    @Body() createUserExternalDto: CreateUserExternalDto,
  ): Promise<UserDto> {
    const providerUser: ProviderUser =
      await this.oauthService.getUserFromProvider(createUserExternalDto);
    const createUser: CreateUserDto = {
      userName: createUserExternalDto.userName,
      email: providerUser.email,
      emailId: 'not_needed_for_external', // Dto requires it, but an external user will never have it
      password: createUserExternalDto.password,
    };
    const user: UserDto = await this.userService.create(createUser);
    const createProviderUserDto: CreateProviderUserDto = {
      providerId: providerUser.providerId,
      externalId: providerUser.externalId,
      userId: user.userId,
    };
    await this.oauthService.createProviderUser(createProviderUserDto);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  findOne(@Request() request: RequestWithUser): Promise<UserEntity> {
    return this.userService.findOne(request.user.userId);
  }
}
