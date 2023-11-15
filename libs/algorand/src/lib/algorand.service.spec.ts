import { Test, TestingModule } from '@nestjs/testing';
import { AlgorandService } from './algorand.service';

describe('AlgorandService', () => {
  let service: AlgorandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlgorandService],
    }).compile();

    service = module.get<AlgorandService>(AlgorandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
